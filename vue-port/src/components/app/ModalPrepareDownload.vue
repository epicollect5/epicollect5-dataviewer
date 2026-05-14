<template>
  <ion-content class="modal-prepare-download ion-padding">
    <div class="modal-prepare-download__body">
      <LoaderSpinner />
      <h2>Preparing download</h2>
      <p>Your file will start downloading shortly.</p>
      <p class="modal-prepare-download__warning">Keep this tab open until the download starts.</p>
    </div>
  </ion-content>
</template>

<script>
import { IonContent } from '@ionic/vue';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';

export default {
  name: 'ModalPrepareDownload',
  components: {
    IonContent,
    LoaderSpinner
  }
};
</script>
<style src="@/theme/app/ModalPrepareDownload.scss" lang="scss"></style>
