<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-img
        alt="FileFlex Logo"
        class="shrink mr-2"
        contain
        :src="require('./assets/LogoApp_0048x0048.png')"
        transition="scale-transition"
        width="40"
      />

      <v-spacer></v-spacer>

      <v-btn href="https://fileflex.com" target="_blank" text>
        <span class="mr-2">File Flex</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <Options />
    </v-content>
  </v-app>
</template>

<script>
import Options from "./components/Options";

export default {
  components: { Options },

  data() {
    return {};
  }
};
</script>
