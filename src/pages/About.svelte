<script>
  import { About, ApplicationDetails } from "svelte-common";
  import { version, description, name } from "../constants.mjs";
</script>

<About>
  <ApplicationDetails {name} {version} {description} />
</About>
