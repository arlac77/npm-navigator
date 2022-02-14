<script>
  import { CommandButton, ConfirmCommand } from "svelte-command";
  import { ObjectLink } from "svelte-guard-history-router";
  import CategoryCard from "../components/CategoryCard.svelte";
  import { session } from "../util.mjs";

  export let router;

  const route = router.route;
  const category = $route.value;

  let valid = false;

  const deleteCommand = category.deleteCommand;

  $: {
    deleteCommand.disabled = !session.hasEntitlement("konsum.category.delete");

    if ($deleteCommand.completed) {
      router.push("/category");
    }
  }

  const command = category.saveCommand;

  $: {
    command.disabled = !valid || !session.hasEntitlement("konsum.category.modify");
  }
</script>

{#if category}
  <h1>Category {category.name}</h1>
  <form>
    <CategoryCard {category} bind:valid />
    <CommandButton {command}/>
    <CommandButton command={new ConfirmCommand(deleteCommand)} />
  </form>

  <ul>
    <li>
      <ObjectLink object={category} suffix="/values/list#last">List</ObjectLink>
    </li>
    <li>
      <ObjectLink object={category} suffix="/values/graph">Graph</ObjectLink>
    </li>
  </ul>
{:else}No such Category{/if}
