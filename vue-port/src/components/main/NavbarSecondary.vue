<template>
  <section class="secondary-navbar">
    <div class="secondary-navbar__start">
      <slot name="start" />
    </div>

    <div class="secondary-navbar__end">
      <slot name="end" />
    </div>
  </section>
</template>

<script>
export default {
  name: 'NavbarSecondary'
};
</script>
<style src="@/theme/app/NavbarSecondary.scss" lang="scss"></style>
