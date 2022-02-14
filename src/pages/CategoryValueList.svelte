<script>
  import { DateTime } from "svelte-common";
  import { CommandButton, ConfirmCommand } from "svelte-command";

  export let router;

  const route = router.route;
  const entries = $route.value;

  const categoryRoute = route.parent.parent;
  const category = $categoryRoute.value;

  function time2Date(time) {
    const date = new Date();
    date.setTime(time * 1000);
    return date;
  }

  setTimeout(() => {
    if (router.path.match(/#last/)) {
      const last = document.getElementById("last");
      if (last) {
        last.scrollIntoView();
      }
    }
  }, 1000);

  //TODO refresh Site after delete value action
</script>

<h1>{category.name}</h1>

{#if entries}
  <table class="bordered striped hoverable">
    <thead>
      <th>Date</th>
      <th>Value</th>
      <th>Action</th>
    </thead>
    <tbody>
      {#each entries as entry, i}
        <tr id={i === 0 ? "first" : i === entries.length - 1 ? "last" : ""}>
          <td>
            <DateTime date={time2Date(entry.time)} />
          </td>
          <td>{entry.value}</td>
          <td>
            <CommandButton
              command={new ConfirmCommand(
                category.deleteValueCommand(entry.time, async response => {
                  route.value = entries.splice(i, 1);
                })
              )}
            /></td
          >
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
