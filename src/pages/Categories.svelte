<script>
  import { ObjectLink, Link } from "svelte-guard-history-router";

  export let router;

  const route = router.route;
  const categories = $route.value;
</script>

<Link href="/category/add">Add New Category</Link>
<table class="bordered striped hoverable">
  <thead>
    <tr>
      <th aria-sort="none">Name</th>
      <th aria-sort="none">Description</th>
      <th aria-sort="none">Unit</th>
    </tr>
  </thead>
  <tbody>
    {#each categories as category (category.name)}
      <tr>
        <td>
          <ObjectLink object={category} />
        </td>
        <td>{category.description}</td>
        <td>{category.unit}</td>
      </tr>
    {/each}
  </tbody>
</table>
