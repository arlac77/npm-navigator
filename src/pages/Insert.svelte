<script>
  import CategoryInsert from "../components/CategoryInsert.svelte";

  export let router;
  
  const route = router.route;
  const categories = $route.value;
</script>

<form>
  {#each categories as category}
    <CategoryInsert {category}/>
  {/each}
</form>
