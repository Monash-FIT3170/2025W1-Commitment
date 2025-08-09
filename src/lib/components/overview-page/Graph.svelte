<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as echarts from "echarts";
    import {
        get_average_commits,
        get_average_commit_size,
        get_metric_min_max,
        get_sd,
        get_ref_points,
        get_users_total_commits,
        get_users_avg_commit_size,
        type Contributor,
        type UserDisplayData
    } from "../../metrics";

    let { contributors, metric }: { contributors: Contributor[], metric: string } = $props();

    let chart_container: HTMLElement;
    let chart: echarts.ECharts;
    let filtered_people: UserDisplayData[] = $state([]);
    let x_min: number = $state(0);
    let x_max: number = $state(1);
    let metric_mean: number = $state(0);
    let sd: number = $state(0);
    let ref_point_values: number[] = $state([]);
    let ref_points: { label: string, value: number }[] = $state([]);
    let resize_handler: () => void;

    $effect(() => {

        switch(metric) {
            case "commits": {
                filtered_people = get_users_total_commits(contributors);
                break;
            }
            case "commit_size": {
                filtered_people = get_users_avg_commit_size(contributors);
                break;
            }
            default: {
                filtered_people = get_users_total_commits(contributors);
                break;
            }
            
        }
        
    });
    $effect(() => {
        metric;
        const min_max: {min: number, max: number} = get_metric_min_max(contributors, metric);
        x_min = min_max.min;
        x_max = min_max.max;
    });
    $effect(() => {
        switch (metric) {
            case "commits": {
                metric_mean = get_average_commits(contributors);
                break;
            }
            case "commit_size": {
                metric_mean = get_average_commit_size(contributors);
                break;
            }
            default: {
                metric_mean = get_average_commits(contributors);
                break;
            }
        }
    });
    $effect(() => {
        sd = get_sd(contributors, metric);
    });
    $effect(() => {
        ref_point_values = get_ref_points(metric_mean, sd);
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
        metric;
        if (chart) {
            set_chart_options();
        }
    });



    function update_graphics() {
        if (!chart) return;
        const grid_top = chart.convertToPixel({ gridIndex: 0 }, [0, 6])[1];
        const x_axis_y = chart.convertToPixel({ gridIndex: 0 }, [0, 0])[1];

        const full_height = x_axis_y - grid_top;
        const tint_height = full_height * 0.9;

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
                container_width - margin_right - clampedX,
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
            x_minus_sigma - x_minus2sigma,
        );
        const middle_tint = clamp_tint(
            x_minus_sigma,
            x_plus_sigma - x_minus_sigma,
        );
        const right_tint = clamp_tint(
            x_plus_sigma,
            x_plus2sigma - x_plus_sigma,
        );

        // White tint between -σ and +σ
        const tint_between1sigma = {
            type: "rect",
            shape: {
                x: middle_tint.x,
                y: x_axis_y - tint_height,
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
                y: x_axis_y - tint_height,
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
                y: x_axis_y - tint_height,
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
                            y1: grid_top,
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
                        y: grid_top - 8,
                        z: 2,
                    },
                ],
            };
        });
        const user_graphics = filtered_people.map((person: UserDisplayData) => {
            const [baseX, y] = chart.convertToPixel({gridIndex: 0}, [person.data_to_display, 1]);
            const x = baseX + (person.offsetIndex ? person.offsetIndex * 16 : 0);
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
        const option = {
            backgroundColor: "transparent", //#222',
            grid: {
                top: "50%",
                bottom: 100,
                left: 40,
                right: 40,
                containLabel: false,
            },
            xAxis: {
                type: 'value',
                min: x_min - 1 < 0 ? 0 : x_min,
                max: x_max,
                name: metric,
                nameTextStyle: {
                    fontSize: 20,
                    fontWeight: "bold",
                    fontFamily: "DM Sans, sans-serif",
                },
                nameLocation: "middle",
                nameGap: 60,
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
                max: 2.5,
            },
            series: [
                {
                    type: 'scatter',
                    data: filtered_people.map((p: UserDisplayData) => [p.data_to_display, 1]),
                    symbolSize: 0,
                    z: 3,
                },
                {
                    name: 'hoverPoints',
                    type: 'scatter',
                    data: filtered_people.map((p: UserDisplayData) => [p.data_to_display, 1, p.username]),
                    symbolSize: 32,
                    z: 10,
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
                            (p: any) => p.username === username,
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

<div bind:this={chart_container} class="chart-container"></div>

<style>
    .chart-container {
        width: 100%;
        height: 500px;
        font-family: "DM Sans", sans-serif;
        padding-bottom: 2rem;
    }
</style>
