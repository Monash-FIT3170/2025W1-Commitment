<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as echarts from "echarts";
    import {
        get_average_commits,
        get_average_commit_size,
        get_metric_min_max,
        get_sd,
        get_ref_points,
        get_quartile_ref_points,
        get_commit_quartiles,
        get_commit_size_quartiles,
        get_absolute_diff_quartiles,
        get_users_total_commits,
        get_users_avg_commit_size,
        get_users_absolute_diff,
        calculate_scaling_factor,
        calculate_quartile_scaling_factor,
        type Contributor,
        type UserDisplayData,
    } from "$lib/metrics";

    let {
        contributors,
        metric,
        aggregation = "mean",
    }: {
        contributors: Contributor[];
        metric: string;
        aggregation?: string;
    } = $props();

    let chart_container: HTMLElement;
    let chart: echarts.ECharts;
    let filtered_people: UserDisplayData[] = $state([]);
    let processed_people: (UserDisplayData & { y_value?: number })[] = $state(
        []
    );
    let is_staggered_mode = $state(false);
    let chart_height = $state(380);
    let is_transitioning = $state(false);
    let x_min: number = $state(0);
    let x_max: number = $state(1);
    let metric_mean: number = $state(0);
    let sd: number = $state(0);
    let quartiles: { q1: number; median: number; q3: number } = $state({
        q1: 0,
        median: 0,
        q3: 0,
    });
    let ref_point_values: number[] = $state([]);
    let ref_points: { label: string; value: number }[] = $state([]);
    let resize_handler: () => void;

    $effect(() => {
        switch (metric) {
            case "commits": {
                filtered_people = get_users_total_commits(contributors);
                break;
            }
            case "commit_size": {
                filtered_people = get_users_avg_commit_size(contributors);
                break;
            }
            case "absolute_diff": {
                filtered_people = get_users_absolute_diff(contributors);
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
        const min_max: { min: number; max: number } = get_metric_min_max(
            contributors,
            metric
        );
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
            case "absolute_diff": {
                filtered_people = get_users_absolute_diff(contributors);
                break;
            }
            default: {
                metric_mean = get_average_commits(contributors);
                break;
            }
        }
    });
    $effect(() => {
        if (is_staggered_mode) {
            const sorted_people = [...filtered_people].sort(
                (a, b) => a.data_to_display - b.data_to_display
            );
            processed_people = sorted_people.map((person, index) => ({
                ...person,
                y_value: 30 + index * 40,
            }));
        } else {
            processed_people = filtered_people.map((p) => ({
                ...p,
                y_value: 1.25,
            }));
        }
    });
    $effect(() => {
        metric;
        aggregation;
        contributors;
        if (chart) {
            set_chart_options();
        }
    });
    $effect(() => {
        // Update chart height based on mode and number of contributors
        const old_height = chart_height;
        const new_height = is_staggered_mode
            ? 100 + filtered_people.length * 80
            : 380;
        chart_height = new_height;

        // Trigger chart resize when height changes
        if (chart && old_height !== new_height) {
            // Use requestAnimationFrame to wait for DOM update
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // First resize immediately
                    chart.resize();

                    // Multiple gradual updates during the transition (every 25ms)
                    const updateIntervals = [];
                    for (let i = 25; i <= 750; i += 25) {
                        updateIntervals.push(i);
                    }

                    updateIntervals.forEach((delay, index) => {
                        setTimeout(() => {
                            chart.resize();

                            // Update graphics only when not transitioning
                            if (!is_transitioning) {
                                update_graphics();
                            }

                            // Only clear and reset options on the final update
                            if (index === updateIntervals.length - 1) {
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
        sd = get_sd(contributors, metric);
        if (aggregation === "median") {
            switch (metric) {
                case "commits": {
                    quartiles = get_commit_quartiles(contributors);
                    break;
                }
                case "commit_size": {
                    quartiles = get_commit_size_quartiles(contributors);
                    break;
                }
                case "absolute_diff": {
                    quartiles = get_absolute_diff_quartiles(contributors);
                    break;
                }
                default: {
                    quartiles = get_commit_quartiles(contributors);
                    break;
                }
            }
        }
    });
    $effect(() => {
        if (aggregation === "mean") {
            ref_point_values = get_ref_points(metric_mean, sd);
        } else {
            ref_point_values = get_quartile_ref_points(contributors, metric);
        }
    });
    $effect(() => {
        if (aggregation === "mean") {
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
        } else {
            ref_points = [
                { label: "Min", value: ref_point_values[0] },
                { label: "Q1", value: ref_point_values[1] },
                { label: "Median", value: ref_point_values[2] },
                { label: "Q3", value: ref_point_values[3] },
                { label: "Max", value: ref_point_values[4] },
            ];
        }
    });

    function update_graphics() {
        if (!chart || is_transitioning) return;
        const grid_top = chart.convertToPixel({ gridIndex: 0 }, [
            0,
            is_staggered_mode
                ? Math.max(30 + (processed_people.length - 1) * 40 + 100, 2.5)
                : 2.5,
        ])[1];
        const x_axis_y = chart.convertToPixel({ gridIndex: 0 }, [0, 0])[1];

        const tint_start_y = is_staggered_mode ? 40 : grid_top;
        const full_height = x_axis_y - grid_top;
        const tint_height = is_staggered_mode
            ? x_axis_y - tint_start_y
            : full_height;

        const axis_min_val = x_min - 1 < 0 ? 0 : x_min;
        const margin_left = chart.convertToPixel({ gridIndex: 0 }, [
            axis_min_val,
            0,
        ])[0];
        const grid_right_px = chart.convertToPixel({ gridIndex: 0 }, [
            x_max,
            0,
        ])[0];
        const drawable_width = grid_right_px - margin_left;
        const container_width = chart_container.clientWidth;
        const margin_right = container_width - grid_right_px;

        function x_scale(value: number) {
            if (x_max - axis_min_val === 0) {
                return margin_left;
            }
            return (
                margin_left +
                ((value - axis_min_val) / (x_max - axis_min_val)) *
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
        const x_p0 = x_scale(ref_point_values[0]);
        const x_p1 = x_scale(ref_point_values[1]);
        const x_p3 = x_scale(ref_point_values[3]);
        const x_p4 = x_scale(ref_point_values[4]);

        // Clamp tints within bounds
        const left_tint = clamp_tint(x_p0, x_p1 - x_p0);
        const middle_tint = clamp_tint(x_p1, x_p3 - x_p1);
        const right_tint = clamp_tint(x_p3, x_p4 - x_p3);

        // White tint between -σ and +σ
        const tint_between1sigma = {
            type: "rect",
            shape: {
                x: middle_tint.x,
                y: tint_start_y,
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
                y: tint_start_y,
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
                y: tint_start_y,
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
                            y1: is_staggered_mode ? 40 : grid_top,
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
                        y: is_staggered_mode ? 20 : grid_top - 8,
                        z: 2,
                    },
                ],
            };
        });
        const user_graphics = processed_people.map((person: any) => {
            const [baseX, y] = chart.convertToPixel({ gridIndex: 0 }, [
                person.data_to_display,
                person.y_value,
            ]);
            const x = is_staggered_mode
                ? baseX
                : baseX + (person.offsetIndex ? person.offsetIndex * 16 : 0);
            
            let scaling_factor: number;

            if (aggregation === 'mean') {
                scaling_factor = calculate_scaling_factor(
                    person.data_to_display,
                    metric_mean,
                    sd
                );
            } else {
                scaling_factor = calculate_quartile_scaling_factor(
                    person.data_to_display,
                    quartiles.q1,
                    quartiles.q3
                );
            }

            const is_rightmost = person.data_to_display === x_max;
            return {
                type: "group",
                children: [
                    {
                        type: "image",
                        style: {
                            image: person.image,
                            width: is_staggered_mode ? 50 : 50,
                            height: is_staggered_mode ? 50 : 50,
                        },
                        x: x - (is_staggered_mode ? 25 : 25),
                        y: y - (is_staggered_mode ? 25 : 25),
                        z: 3,
                        silent: false,
                        clipPath: {
                            type: "circle",
                            shape: {
                                cx: is_staggered_mode ? 25 : 25,
                                cy: is_staggered_mode ? 25 : 25,
                                r: is_staggered_mode ? 25 : 25,
                            },
                        },
                    },
                    ...(is_staggered_mode
                        ? [
                              {
                                  type: "text",
                                  style: {
                                      text: person.username,
                                      fontSize: 14,
                                      fontWeight: "900",
                                      fill: "#fff",
                                      font: 'bold 16px "DM Sans ExtraBold", sans-serif',
                                      textAlign: is_rightmost
                                          ? "right"
                                          : "left",
                                      textVerticalAlign: "top",
                                  },
                                  x: is_rightmost ? x - 40 : x + 40, // Left for rightmost, right otherwise
                                  y: y - 15,
                                  z: 2,
                              },

                              {
                                  type: "text",
                                  style: {
                                      text: `Scaling Factor: ${scaling_factor.toFixed(1)}`,
                                      fontSize: 14,
                                      fill: "#fff",
                                      font: 'bold 16px "DM Sans", sans-serif',
                                      textAlign: is_rightmost
                                          ? "right"
                                          : "left",
                                      textVerticalAlign: "top",
                                  },
                                  x: is_rightmost ? x - 40 : x + 40, // Left for rightmost, right otherwise
                                  y: y + 5,
                                  z: 2,
                              },
                          ]
                        : []),
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
            animation: true,
            animationDuration: 800,
            animationEasing: "cubicInOut" as const,
            animationDelay: 0,
            grid: {
                top: 30,
                bottom: is_staggered_mode ? 80 : 80,
                left: "5%",
                right: "5%",
                containLabel: true,
            },
            xAxis: {
                type: "value",
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
                max: is_staggered_mode
                    ? Math.max(
                          30 + (processed_people.length - 1) * 40 + 100,
                          2.5
                      )
                    : 2.5,
            },
            series: [
                {
                    type: "scatter",
                    data: processed_people.map((p: any) => [
                        p.data_to_display,
                        p.y_value,
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
                    data: processed_people.map((p: any) => [
                        p.data_to_display,
                        p.y_value,
                        p.username,
                    ]),
                    symbolSize: 40,
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
                        const person = processed_people.find(
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
        chart.setOption(option, true);
        update_graphics();
    }

    onMount(() => {
        chart = echarts.init(chart_container);
        set_chart_options();

        chart.on("click", (params: any) => {
            if (
                params.componentType === "graphic" &&
                params.componentSubType === "image"
            ) {
                return;
            }

            chart.dispatchAction({ type: "hideTip" });

            is_transitioning = true;
            chart.clear();

            set_chart_options();

            requestAnimationFrame(() => {
                is_staggered_mode = !is_staggered_mode;
            });
        });

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

<div
    bind:this={chart_container}
    class="chart-container"
    style="height: {chart_height}px; transition: height 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);"
></div>

<style>
    .chart-container {
        width: 100%;
        font-family: "DM Sans", sans-serif;
    }
</style>
