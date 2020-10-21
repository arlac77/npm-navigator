<script>
  import { About, ApplicationDetails } from "svelte-common";
  import version from "consts:version";
  import description from "consts:description";
  import name from "consts:name";
</script>

<About>
  <ApplicationDetails {name} {version} {description} />
</About>
