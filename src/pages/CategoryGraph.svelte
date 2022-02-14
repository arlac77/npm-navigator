<script>
  import { LayerCake, Svg } from "layercake";
  import Line from "../components/Line.svelte";
  import Area from "../components/Area.svelte";
  import AxisX from "../components/AxisX.svelte";
  import AxisY from "../components/AxisY.svelte";

  export let router;
  const route = router.route;

  let data = [
  ];

  $: {
    const vv = $route.value;

    if (vv) {
      let last = vv[0];

      data = [];
      for (const c of vv) {
        const days = (c.time - last.time) / (24 * 60 * 60);
        const y = (c.value - last.value) / days;

        if (c.time > 0 && y >= 0 && y < 30) {
          const x = (c.time / (364.25 * 24 * 60 * 60)) + 1970
          data.push({ x, y });
        }
        else {
          console.log(c.time / (364.25 * 24 * 60 * 60) + 1970);
        }
        last = c;
      }
    }
  }
  
</script>

<style>
  .chart-container {
    width: 1000px;
    height: 200px;
  }
</style>

<div class="chart-container">
  <LayerCake
    padding={{ right: 10, bottom: 20, left: 25 }}
    x={'x'}
    y={'y'}
    yDomain={[0, null]}
    {data}>
    <Svg>
      <AxisX />
      <AxisY ticks={4} />
      <Line />
      <Area />
    </Svg>
  </LayerCake>
</div>
