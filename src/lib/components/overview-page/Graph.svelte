<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as echarts from "echarts";
    import {
        get_average_commits,
        get_sd,
        get_ref_points,
        type Contributor,
    } from "../../metrics";

    let { contributors }: { contributors: Contributor[] } = $props();

    let chart_container: HTMLElement;
    let chart: echarts.ECharts;
    let filtered_people: any[] = [];
    let min_commits: number = 0;
    let max_commits: number = 1;
    let x_min: number = 0;
    let x_max: number = 1;
    let commit_mean: number = 0;
    let sd: number = 0;
    let ref_point_values: number[] = [];
    let refPoints: { label: string, value: number }[] = [];
    let resizeHandler: () => void;
    let isStaggeredMode = $state(false);
    let chartHeight = $state(350);
    let isTransitioning = $state(false);

    $effect(() => {
        filtered_people = get_user_commits(contributors);
    });
    
    // Watch for staggered mode changes specifically
    $effect(() => {
        console.log('Staggered mode effect triggered:', isStaggeredMode);
        if (isStaggeredMode !== undefined) {
            filteredPeople = getUserCommits(contributors);
            // Force height recalculation
            console.log('Forcing height recalculation due to mode change');
        }
    });
    $effect(() => {
        minCommits = filteredPeople.length > 0 ? Math.min(...filteredPeople.map((p: any) => p.numCommits)) : 0;
    });
    $effect(() => {
        max_commits =
            filtered_people.length > 0
                ? Math.max(...filtered_people.map((p: any) => p.num_commits))
                : 1;
    });
    $effect(() => {
        x_min = min_commits === max_commits ? min_commits - 1 : min_commits - 1;
    });
    $effect(() => {
        x_max = min_commits === max_commits ? max_commits + 1 : max_commits + 1;
    });
    $effect(() => {
        commit_mean = get_average_commits(contributors);
    });
    $effect(() => {
        sd = get_sd(contributors);
    });
    $effect(() => {
        ref_point_values = get_ref_points(commit_mean, sd);
    });
    $effect(() => {
        ref_points =
            sd === 0
                ? [{ label: "mean", value: ref_point_values[2] }]
                : [
                      { label: "-2σ", value: ref_point_values[0] },
                      { label: "-σ", value: ref_point_values[1] },
                      { label: "mean", value: ref_point_values[2] },
                      { label: "+σ", value: ref_point_values[3] },
                      { label: "+2σ", value: ref_point_values[4] },
                  ];
    });
    $effect(() => {
        // Update chart height based on mode and number of contributors
        const oldHeight = chartHeight;
        const newHeight = isStaggeredMode ? 100 + (filteredPeople.length * 80) : 350;
        console.log('Height effect triggered. Old height:', oldHeight, 'New height:', newHeight, 'Staggered mode:', isStaggeredMode, 'Contributors:', filteredPeople.length);
        chartHeight = newHeight;
        
        // Trigger chart resize when height changes
        if (chart && oldHeight !== newHeight) {
            console.log('Resizing chart due to height change');
            // Use requestAnimationFrame to wait for DOM update
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    console.log('Starting gradual chart updates');
                    console.log('Initial container dimensions:', chartContainer.clientWidth, 'x', chartContainer.clientHeight);
                    
                    // First resize immediately
                    chart.resize();
                    
                    // Multiple gradual updates during the transition (every 25ms)
                    const updateIntervals = [];
                    for (let i = 25; i <= 750; i += 25) {
                        updateIntervals.push(i);
                    }
                    
                    updateIntervals.forEach((delay, index) => {
                        setTimeout(() => {
                            console.log(`Update ${index + 1} at ${delay}ms:`, chartContainer.clientWidth, 'x', chartContainer.clientHeight);
                            chart.resize();
                            
                            // Update graphics only when not transitioning
                            if (!isTransitioning) {
                                updateGraphics();
                            }
                            
                            // Only clear and reset options on the final update
                            if (index === updateIntervals.length - 1) {
                                console.log('Final refresh - clearing and resetting options');
                                chart.clear();
                                setChartOptions();
                                // Re-enable contributor icons after transition completes
                                isTransitioning = false;
                                // Call updateGraphics to render icons now that transition is complete
                                updateGraphics();
                            }
                        }, delay);
                    });
                });
            });
        }
    });
    $effect(() => {
        if (chart) setChartOptions();
    });

    function get_user_commits(users: Contributor[]) {
        if (users.length === 0) return [];
        let user_total_commits: any[] = [];
        users.forEach((user) => {
            user_total_commits.push({
                username: user.bitmap_hash,
                image: user.bitmap,
                numCommits: user.total_commits,
            });
        });
        const sortedCommits = userTotalCommits.sort((a, b) => a.numCommits - b.numCommits);
        
        if (isStaggeredMode) {
            // In staggered mode, assign y-values progressively from left to right with reduced spacing
            return sortedCommits.map((user, index) => ({
                ...user,
                yValue: 30 + (index * 40)  // Start at 30 with 40px spacing
            }));
        } else {
            // Original mode with offsetIndex for same x-values
            const groups = new Map<number, any[]>();
            sortedCommits.forEach(user => {
                if (!groups.has(user.numCommits)) {
                    groups.set(user.numCommits, []);
                }
                groups.get(user.numCommits)!.push(user);
            });
            const result: any[] = [];
            groups.forEach((users, commits) => {
                if (users.length === 1) {
                    result.push({ 
                        ...users[0], 
                        yValue: 1,
                        offsetIndex: 0 // Reset offsetIndex
                    });
                } else {
                    users.forEach((user, index) => {
                        result.push({
                            ...user,
                            offsetIndex: index - (users.length - 1) / 2,
                            yValue: 1
                        });
                    });
                }
            });
            return result;
        }
    }

    function updateGraphics() {
        if (!chart || isTransitioning) return;
        const gridTop = chart.convertToPixel({gridIndex: 0}, [0, isStaggeredMode ? Math.max(30 + ((filteredPeople.length - 1) * 40) + 100, 2.5) : 2.5])[1];
        const xAxisY = chart.convertToPixel({gridIndex: 0}, [0, 0])[1];

        const tintStartY = isStaggeredMode ? 40 : gridTop; // Start below text labels (40px from top in staggered mode)
        const tintHeight = xAxisY - tintStartY;

        const margin_left = 40; // px
        const margin_right = 40; // px
        const container_width = chart_container.clientWidth;
        const drawable_width = container_width - margin_left - margin_right;

        function x_scale(value: number) {
            return (
                margin_left +
                ((value - x_min) / (x_max - x_min)) * drawable_width
            );
        }

        // Clamp function to ensure tints stay inside drawable area
        function clamp_tint(x: number, width: number) {
            const clampedX = Math.max(x, margin_left);
            const maxWidth = Math.min(
                width - (clampedX - x),
                container_width - margin_right - clampedX
            );
            return { x: clampedX, width: maxWidth };
        }

        // Calculate pixel positions of ref points (commit counts)
        const x_minus2sigma = x_scale(ref_point_values[0]);
        const x_minus_sigma = x_scale(ref_point_values[1]);
        const x_plus_sigma = x_scale(ref_point_values[3]);
        const x_plus2sigma = x_scale(ref_point_values[4]);

        // Clamp tints within bounds
        const left_tint = clamp_tint(
            x_minus2sigma,
            x_minus_sigma - x_minus2sigma
        );
        const middle_tint = clamp_tint(
            x_minus_sigma,
            x_plus_sigma - x_minus_sigma
        );
        const right_tint = clamp_tint(
            x_plus_sigma,
            x_plus2sigma - x_plus_sigma
        );

        // White tint between -σ and +σ
        const tint_between1sigma = {
            type: "rect",
            shape: {
                x: middleTint.x,
                y: tintStartY, // Start below text labels
                width: middleTint.width,
                height: tintHeight
            },
            style: {
                fill: "rgba(255, 255, 255, 0.20)",
            },
            silent: true,
            z: 1,
        };

        const tint_between2sigma_left = {
            type: "rect",
            shape: {
                x: leftTint.x,
                y: tintStartY, // Start below text labels
                width: leftTint.width,
                height: tintHeight
            },
            style: {
                fill: "rgba(255, 255, 255, 0.1)",
            },
            silent: true,
            z: 1,
        };

        const tint_between2sigma_right = {
            type: "rect",
            shape: {
                x: rightTint.x,
                y: tintStartY, // Start below text labels
                width: rightTint.width,
                height: tintHeight
            },
            style: {
                fill: "rgba(255, 255, 255, 0.1)",
            },
            silent: true,
            z: 1,
        };

        const ref_line_graphics = ref_points.map((ref) => {
            const x = chart.convertToPixel({ gridIndex: 0 }, [ref.value, 0])[0];
            return {
                type: "group",
                children: [
                    {
                        type: "line",
                        shape: {
                            x1: x,
                            y1: isStaggeredMode ? 40 : gridTop, // Start below the text labels
                            x2: x,
                            y2: x_axis_y,
                        },
                        style: {
                            stroke: "#fff",
                            lineDash: [4, 4],
                            lineWidth: 1,
                            opacity: 0.5,
                        },
                        silent: true,
                    },
                    {
                        type: "text",
                        style: {
                            text: ref.label,
                            fontSize: 14,
                            fill: "#fff",
                            font: 'bold 16px "DM Sans", sans-serif',
                            textAlign: "center",
                            textVerticalAlign: "bottom",
                        },
                        x: x,
                        y: isStaggeredMode ? 20 : gridTop - 8, // Fixed position in staggered mode
                        z:2
                    }
                ]
            };
        });
        const userGraphics = isTransitioning ? [] : filteredPeople.map((person: any) => {
            const [baseX, y] = chart.convertToPixel({gridIndex: 0}, [person.numCommits, person.yValue]);
            const x = isStaggeredMode ? baseX : baseX + (person.offsetIndex ? person.offsetIndex * 16 : 0);
            return {
                type: "group",
                children: [
                    {
                        type: "image",
                        style: {
                            image: person.image,
                            width: 40,
                            height: 40,
                        },
                        x: x - 20,
                        y: y - 20,
                        z: 3,
                        silent: false,
                        clipPath: {
                            type: "circle",
                            shape: {
                                cx: 20,
                                cy: 20,
                                r: 20,
                            },
                        },
                    },
                ],
            };
        });
        chart.setOption({
            graphic: [
                tint_between2sigma_left,
                tint_between1sigma,
                tint_between2sigma_right,
                ...ref_line_graphics,
                ...user_graphics,
            ],
        });
    }

    function setChartOptions() {
        console.log('setChartOptions called. Staggered mode:', isStaggeredMode, 'Chart height:', chartHeight, 'Filtered people:', filteredPeople.length);
        const option = {
            backgroundColor: 'transparent',  //#222',
            animation: true,
            animationDuration: 800,
            animationEasing: 'cubicInOut' as const,
            animationDelay: 0,
            grid: {
                top: 30, // Provides enough space for top labels while keeping chart at top
                bottom: isStaggeredMode ? 80 : 80, // Keep consistent bottom margin
                left: '5%',
                right: '5%',
                containLabel: true
            },
            xAxis: {
                type: "value",
                min: x_min,
                max: x_max,
                name: "Total Commits",
                nameTextStyle: {
                    fontSize: 20,
                    fontWeight: "bold",
                    fontFamily: "DM Sans, sans-serif",
                },
                nameLocation: 'middle',
                nameGap: 60, // Tighter gap for axis title
                axisLine: {
                    lineStyle: {
                        color: "#fff",
                        width: 2,
                    },
                },
                axisLabel: {
                    color: "#fff",
                    fontSize: 15,
                    margin: 30,
                },
                splitLine: { show: false },
                axisTick: {
                    length: 20,
                    lineStyle: {
                        color: "#fff",
                        width: 2,
                    },
                },
                position: "bottom",
            },
            yAxis: {
                show: false,
                min: 0,
                max: (() => {
                    const maxY = isStaggeredMode ? Math.max(30 + ((filteredPeople.length - 1) * 40) + 100, 2.5) : 2.5;
                    console.log('Y-axis max set to:', maxY, 'for staggered mode:', isStaggeredMode);
                    return maxY;
                })(),
            },
            series: [
                {
                    type: 'scatter',
                    data: filteredPeople.map((p: any) => [p.numCommits, p.yValue]),
                    symbolSize: 0,
                    z: 3,
                    animation: true,
                    animationDuration: 800,
                    animationEasing: 'cubicInOut' as const
                },
                {
                    name: 'hoverPoints',
                    type: 'scatter',
                    data: filteredPeople.map((p: any) => [p.numCommits, p.yValue, p.username]),
                    symbolSize: 32,
                    z: 10,
                    animation: true,
                    animationDuration: 800,
                    animationEasing: 'cubicInOut' as const,
                    itemStyle: {
                        color: "transparent",
                    },
                    emphasis: {
                        focus: "series",
                        itemStyle: {
                            color: "transparent",
                            borderColor: "#fff",
                            borderWidth: 2,
                            shadowBlur: 10,
                            shadowColor: "rgba(255, 255, 255, 0.7)",
                        },
                    },
                },
            ],
            tooltip: {
                trigger: "item",
                formatter: function (params: any) {
                    if (params.seriesName === "hoverPoints") {
                        const username = params.data[2];
                        const person = filtered_people.find(
                            (p: any) => p.username === username
                        );
                        if (!person) return username;
                        return `
                          <div style="text-align: left;">
                            <strong>${username}</strong><br/>
                            Total Commits: ${params.data[0]}
                          </div>
                        `;
                    }
                    return "";
                },
            },
            graphic: [],
        };
        chart.setOption(option, true);
        update_graphics();
    }

    onMount(() => {
        chart = echarts.init(chartContainer);
        setChartOptions();
        
        // Add click event listener to toggle staggered mode
        chart.on('click', () => {
            console.log('Graph clicked! Current mode:', isStaggeredMode);

            // Clear any existing tooltip
            chart.dispatchAction({ type: 'hideTip' });

            // Mark transitioning and clear chart immediately so nothing is shown
            isTransitioning = true;
            chart.clear();

            // Re-apply base axes immediately so the x-axis remains visible during transition
            setChartOptions();

            // Toggle mode on the next frame to ensure the clear is painted first
            requestAnimationFrame(() => {
                isStaggeredMode = !isStaggeredMode;
                console.log('New mode (applied after clear):', isStaggeredMode);
            });
        });
        
        resizeHandler = () => {
            chart.resize();
            update_graphics();
        };
        window.addEventListener("resize", resize_handler);
    });
    onDestroy(() => {
        window.removeEventListener("resize", resize_handler);
        chart.dispose();
    });
</script>

<div bind:this={chartContainer} class="chart-container" style="height: {chartHeight}px; transition: height 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);"></div>

<style>
    .chart-container {
        width: 100%;
        font-family: 'DM Sans', sans-serif;
        padding-bottom: 2rem;
    }
</style>
