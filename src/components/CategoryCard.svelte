<script>
  import imask from "../imask.mjs";

  export let category;
  export let valid = false;

  $: {
    valid =
      category.name &&
      category.name.length &&
      category.description &&
      category.description.length &&
      category.unit &&
      category.unit.length &&
      category.fractionalDigits;
  }

  function accept({ detail: maskRef }) {
    category.fractionalDigits = maskRef.value;
  }
</script>

<label for="name">
  Name
  <input
    id="name"
    type="text"
    placeholder="Name"
    size="20"
    required
    bind:value={category.name} />
</label>

<label for="description">
  Description
  <input
    id="description"
    type="text"
    placeholder="Description"
    size="20"
    required
    bind:value={category.description} />
</label>
<label for="unit">
  Unit
  <input
    id="unit"
    type="text"
    placeholder="Unit"
    size="20"
    required
    bind:value={category.unit} />
</label>

<label for="fractionalDigits">
  Fractional digits
  <input
    id="fractionalDigits"
    type="text"
    placeholder="Fractional Digits"
    size="20"
    required
    use:imask={{ mask: Number, scale: 0, signed: false, min: 0, max: 5 }}
    bind:value={category.fractionalDigits} />
</label>
