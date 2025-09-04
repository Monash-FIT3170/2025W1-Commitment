<script lang="ts">
    import * as echarts from "echarts";
    import {
        get_average_commits,
        get_average_commit_size,
        get_metric_min_max,
        get_sd,
        get_ref_points,
        get_users_total_commits,
        get_users_avg_commit_size,
        get_users_absolute_diff,
        calculate_scaling_factor,
        type Contributor,
        type UserDisplayData,
    } from "$lib/metrics";
    import { onDestroy, onMount } from "svelte";

    let {
        contributors,
        selected_branch = $bindable(""),
        start_date = $bindable(""),
        end_date = $bindable(""),
        metric,
    }: {
        contributors: Contributor[];
        selected_branch?: string;
        start_date?: string;
        end_date?: string;
        metric: string;
    } = $props();

    let chart_container = $state<HTMLElement>();
    let chart: echarts.ECharts;

    let resize_handler: () => void;
    let is_staggered_mode = $state(false);
    let chart_height = $state(350);
    let is_transitioning = $state(false);

    let chart_key = $derived(
        contributors.map((c) => c.bitmap_hash).join(",") +
            selected_branch +
            start_date +
            end_date
    );

    let filtered_people: UserDisplayData[] = $derived.by(() => {
        switch (metric) {
            case "commits": {
                return get_users_total_commits(contributors);
            }
            case "commit_size": {
                return get_users_avg_commit_size(contributors);
            }
            case "absolute_diff": {
                return get_users_absolute_diff(contributors);
            }
            default: {
                return get_users_total_commits(contributors);
            }
        }
    });

    // Watch for staggered mode changes specifically
    $effect(() => {
        console.log("Staggered mode effect triggered:", is_staggered_mode);
        if (is_staggered_mode !== undefined) {
            filtered_people = get_user_commits(contributors);
            // Force height recalculation
            console.log("Forcing height recalculation due to mode change");
        }
    });

    let x_minmax: { min: number; max: number } = $derived(
        get_metric_min_max(contributors, metric)
    );

    let metric_mean = $derived.by(() => {
        switch (metric) {
            case "commits": {
                return get_average_commits(contributors);
            }
            case "commit_size": {
                return get_average_commit_size(contributors);
            }
            case "absolute_diff": {
                filtered_people = get_users_absolute_diff(contributors);
            }
            default: {
                return get_average_commits(contributors);
            }
        }
    });

    let sd: number = $derived(get_sd(contributors, metric));

    let ref_point_values: number[] = $derived(get_ref_points(metric_mean, sd));

    let ref_points: { label: string; value: number }[] = $derived(
        sd === 0
            ? [{ label: "mean", value: ref_point_values[2] }]
            : [
                  { label: "-2σ", value: ref_point_values[0] },
                  { label: "-σ", value: ref_point_values[1] },
                  { label: "mean", value: ref_point_values[2] },
                  { label: "+σ", value: ref_point_values[3] },
                  { label: "+2σ", value: ref_point_values[4] },
              ]
    );

    $effect(() => {
        // Update chart height based on mode and number of contributors
        const old_height = chart_height;
        const new_height = is_staggered_mode
            ? 100 + filtered_people.length * 80
            : 350;

        console.log(
            "Height effect triggered. Old height:",
            old_height,
            "New height:",
            new_height,
            "Staggered mode:",
            is_staggered_mode,
            "Contributors:",
            filtered_people.length
        );

        chart_height = new_height;

        // Trigger chart resize when height changes
        if (chart && old_height !== new_height) {
            console.log("Resizing chart due to height change");
            // Use requestAnimationFrame to wait for DOM update
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    console.log("Starting gradual chart updates");
                    console.log(
                        "Initial container dimensions:",
                        chart_container.clientWidth,
                        "x",
                        chart_container.clientHeight
                    );

                    // First resize immediately
                    chart.resize();

                    // Multiple gradual updates during the transition (every 25ms)
                    const updateIntervals = [];
                    for (let i = 25; i <= 750; i += 25) {
                        updateIntervals.push(i);
                    }

                    updateIntervals.forEach((delay, index) => {
                        setTimeout(() => {
                            console.log(
                                `Update ${index + 1} at ${delay}ms:`,
                                chart_container.clientWidth,
                                "x",
                                chart_container.clientHeight
                            );
                            chart.resize();

                            // Update graphics only when not transitioning
                            if (!is_transitioning) {
                                update_graphics();
                            }

                            // Only clear and reset options on the final update
                            if (index === updateIntervals.length - 1) {
                                console.log(
                                    "Final refresh - clearing and resetting options"
                                );
                                chart.clear();
                                set_chart_options();
                                // Re-enable contributor icons after transition completes
                                is_transitioning = false;
                                // Call updateGraphics to render icons now that transition is complete
                                update_graphics();
                            }
                        }, delay);
                    });
                });
            });
        }
    });

    $effect(() => {
        metric;
        if (chart) {
            set_chart_options();
        }
    });

    function get_user_commits(users: Contributor[]) {
        if (users.length === 0) return [];

        let user_total_commits: any[] = [];
        users.forEach((user) => {
            user_total_commits.push({
                username: user.username,
                image: user.bitmap,
                num_commits: user.total_commits,
            });
        });

        const sorted_commits = user_total_commits.sort(
            (a, b) => a.num_commits - b.num_commits
        );

        if (is_staggered_mode) {
            // In staggered mode, assign y-values progressively from left to right with reduced spacing
            return sorted_commits.map((user, index) => ({
                ...user,
                y_value: 30 + index * 40, // Start at 30 with 40px spacing
            }));
        } else {
            // Original mode with offsetIndex for same x-values
            const groups = new Map<number, any[]>();
            sorted_commits.forEach((user) => {
                if (!groups.has(user.num_commits)) {
                    groups.set(user.num_commits, []);
                }
                groups.get(user.num_commits)!.push(user);
            });

            const result: any[] = [];
            groups.forEach((users, commits) => {
                if (users.length === 1) {
                    result.push({
                        ...users[0],
                        y_value: 1,
                        offset_index: 0, // Reset offsetIndex
                    });
                } else {
                    users.forEach((user, index) => {
                        result.push({
                            ...user,
                            offset_index: index - (users.length - 1) / 2,
                            y_value: 1,
                        });
                    });
                }
            });
            return result;
        }
    }

    function update_graphics() {
        if (!chart || is_transitioning) return;

        const grid_top = chart.convertToPixel({ gridIndex: 0 }, [
            0,
            is_staggered_mode
                ? Math.max(30 + (filtered_people.length - 1) * 40 + 100, 2.5)
                : 2.5,
        ])[1];
        const x_axis_y = chart.convertToPixel({ gridIndex: 0 }, [0, 0])[1];

        const tint_start_y = is_staggered_mode ? 40 : grid_top; // Start below text labels (40px from top in staggered mode)
        const tint_height = x_axis_y - tint_start_y;

        const margin_left = 40; // px
        const margin_right = 40; // px
        const container_width = chart_container.clientWidth;
        const drawable_width = container_width - margin_left - margin_right;

        function x_scale(value: number) {
            return (
                margin_left +
                ((value - x_minmax.min) / (x_minmax.max - x_minmax.min)) *
                    drawable_width
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
                x: middle_tint.x,
                y: tint_start_y, // Start below text labels
                width: middle_tint.width,
                height: tint_height,
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
                x: left_tint.x,
                y: tint_start_y, // Start below text labels
                width: left_tint.width,
                height: tint_height,
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
                x: right_tint.x,
                y: tint_start_y, // Start below text labels
                width: right_tint.width,
                height: tint_height,
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
                            y1: is_staggered_mode ? 40 : grid_top, // Start below the text labels
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
                        y: is_staggered_mode ? 20 : grid_top - 8, // Fixed position in staggered mode
                        z: 2,
                    },
                ],
            };
        });

        const user_graphics = filtered_people.map((person: UserDisplayData) => {
            const [baseX, y] = chart.convertToPixel({ gridIndex: 0 }, [
                person.data_to_display,
                1,
            ]);
            const x =
                baseX + (person.offsetIndex ? person.offsetIndex * 16 : 0);
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

    function set_chart_options() {
        console.log(
            "set_chart_options called. Staggered mode:",
            is_staggered_mode,
            "Chart height:",
            chart_height,
            "Filtered people:",
            filtered_people.length
        );

        const option = {
            backgroundColor: "transparent", //#222',
            animation: true,
            animationDuration: 800,
            animationEasing: "cubicInOut" as const,
            animationDelay: 0,
            grid: {
                top: 30, // Provides enough space for top labels while keeping chart at top
                bottom: is_staggered_mode ? 80 : 80, // Keep consistent bottom margin
                left: "5%",
                right: "5%",
                containLabel: true,
            },
            xAxis: {
                type: "value",
                min: x_minmax.min - 1 < 0 ? 0 : x_minmax.min,
                max: x_minmax.max,
                name: metric,
                nameTextStyle: {
                    fontSize: 20,
                    fontWeight: "bold",
                    fontFamily: "DM Sans, sans-serif",
                },
                nameLocation: "middle",
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
                    const max_y = is_staggered_mode
                        ? Math.max(
                              30 + (filtered_people.length - 1) * 40 + 100,
                              2.5
                          )
                        : 2.5;
                    console.log(
                        "Y-axis max set to:",
                        max_y,
                        "for staggered mode:",
                        is_staggered_mode
                    );
                    return max_y;
                })(),
            },
            series: [
                {
                    type: "scatter",
                    data: filtered_people.map((p: UserDisplayData) => [
                        p.data_to_display,
                        1,
                    ]),
                    symbolSize: 0,
                    z: 3,
                    animation: true,
                    animationDuration: 800,
                    animationEasing: "cubicInOut" as const,
                },
                {
                    name: "hoverPoints",
                    type: "scatter",
                    data: filtered_people.map((p: any) => [
                        p.num_commits,
                        p.y_value,
                        p.username,
                    ]),
                    symbolSize: 32,
                    z: 10,
                    animation: true,
                    animationDuration: 800,
                    animationEasing: "cubicInOut" as const,
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
                            ${metric}: ${params.data[0]}
                          </div>
                        `;
                    }
                    return "";
                },
            },
            graphic: [],
        };
        chart.clear();
        chart.setOption(option, true);
        chart.resize();
        setTimeout(() => {
            update_graphics();
        }, 0);
    }

    $effect(() => {
        if (chart_container) {
            if (chart) {
                window.removeEventListener("resize", resize_handler);
                chart.dispose();
            }
            chart = echarts.init(chart_container);
            set_chart_options();
            window.addEventListener("resize", resize_handler);

            // Add click event listener to toggle staggered mode
            chart.on("click", () => {
                console.log("Graph clicked! Current mode:", is_staggered_mode);

                // Clear any existing tooltip
                chart.dispatchAction({ type: "hideTip" });

                // Mark transitioning and clear chart immediately so nothing is shown
                is_transitioning = true;
                chart.clear();

                // Re-apply base axes immediately so the x-axis remains visible during transition
                set_chart_options();

                // Toggle mode on the next frame to ensure the clear is painted first
                requestAnimationFrame(() => {
                    is_staggered_mode = !is_staggered_mode;
                    console.log(
                        "New mode (applied after clear):",
                        is_staggered_mode
                    );
                });
            });

            resize_handler = () => {
                chart.resize();
                update_graphics();
            };
            window.addEventListener("resize", resize_handler);
        }
        return () => {
            if (chart) {
                window.removeEventListener("resize", resize_handler);
                chart.dispose();
            }
        };
    });

    onMount(() => {
        chart = echarts.init(chart_container);
        set_chart_options();
        resize_handler = () => {
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

{#key chart_key}
    <div
        bind:this={chart_container}
        class="chart-container"
        style="height: {chart_height}px; transition: height 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);"
    ></div>
{/key}

<style>
    .chart-container {
        width: 100%;
        font-family: "DM Sans", sans-serif;
        padding-bottom: 0rem;
    }
</style>
