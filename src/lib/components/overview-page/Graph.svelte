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
    let ref_points: { label: string; value: number }[] = [];
    let resize_handler: () => void;

    $effect(() => {
        filtered_people = get_user_commits(contributors);
    });
    $effect(() => {
        min_commits =
            filtered_people.length > 0
                ? Math.min(...filtered_people.map((p: any) => p.num_commits))
                : 0;
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
        if (chart) set_chart_options();
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
        const sorted_commits = user_total_commits.sort(
            (a, b) => a.numCommits - b.numCommits,
        );
        const groups = new Map<number, any[]>();
        sorted_commits.forEach((user) => {
            if (!groups.has(user.numCommits)) {
                groups.set(user.numCommits, []);
            }
            groups.get(user.numCommits)!.push(user);
        });
        const result: any[] = [];
        groups.forEach((users, commits) => {
            if (users.length === 1) {
                result.push(users[0]);
            } else {
                users.forEach((user, index) => {
                    result.push({
                        ...user,
                        offsetIndex: index - (users.length - 1) / 2,
                    });
                });
            }
        });
        return result;
    }

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
        const user_graphics = filtered_people.map((person: any) => {
            const [baseX, y] = chart.convertToPixel({ gridIndex: 0 }, [
                person.numCommits,
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
                type: "value",
                min: x_min,
                max: x_max,
                name: "Total Commits",
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
                    type: "scatter",
                    data: filtered_people.map((p: any) => [p.numCommits, 1]),
                    symbolSize: 0,
                    z: 3,
                },
                {
                    name: "hoverPoints",
                    type: "scatter",
                    data: filtered_people.map((p: any) => [
                        p.numCommits,
                        1,
                        p.username,
                    ]),
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
