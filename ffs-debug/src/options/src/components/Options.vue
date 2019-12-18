<template>
  <v-container>
    <v-layout column style="position: relative">
      <v-overlay v-if="!isDataLoaded" absolute color="#FFF"></v-overlay>

      <v-flex mt-6>
        <v-img
          :src="require('../assets/app_icon.png')"
          class="my-3"
          contain
          height="100"
        ></v-img>
      </v-flex>

      <v-flex text-center mb-6>
        <h1 class="display-2 font-weight mb-3">
          FFS Extension Settings
        </h1>
      </v-flex>

      <v-flex>
        <h2 class="headline font-weight-bold mb-3">Authorization</h2>

        <v-text-field
          label="Secret key"
          clearable
          v-model="secret"
          :type="showSecret ? 'text' : 'password'"
          :append-icon="showSecret ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append="showSecret = !showSecret"
          :rules="[rules.required, rules.min(3)]"
        >
        </v-text-field>
      </v-flex>

      <v-flex>
        <h2 class="headline font-weight-bold mb-3">Skin</h2>
        <v-text-field label="Skin" clearable v-model="skin"></v-text-field>
      </v-flex>

      <v-flex>
        <h2 class="headline font-weight-bold mb-3">Loggers</h2>
        <v-text-field
          label="Logger levels"
          clearable
          v-model="logLevels"
          hint="logger1:level, logger2:level, ..."
          :rules="[rules.logLevels]"
        >
        </v-text-field>
      </v-flex>

      <v-flex>
        <h2 class="headline font-weight-bold mb-3">Replace resources</h2>
        <v-data-table
          :headers="[
            { text: 'Original', value: 'key', width: '50%' },
            { text: 'Replaced with', value: 'value', width: '50%' },
            {
              text: 'Actions',
              value: 'action',
              sortable: false,
              class: 'text-end'
            }
          ]"
          :items="replaceResources"
          fixed-header
          hide-default-footer
          class="elevation-1"
        >
          <template v-slot:top>
            <v-toolbar flat color="white">
              <v-spacer></v-spacer>
              <DialogReplaceResource
                :editItem="editingReplaceResource"
                @action="onSaveReplaceResource"
                @close="editingReplaceResource=null"
              />
            </v-toolbar>
          </template>

          <template v-slot:item.action="{ item }">
            <div class="text-end">
              <v-icon small class="mr-2" @click="editReplaceResource(item)"
                >mdi-pencil</v-icon
              >
              <v-icon small @click="deleteReplaceResource(item)"
                >mdi-delete</v-icon
              >
            </div>
          </template>
          <template v-slot:no-data> No resources replaced</template>
        </v-data-table>
      </v-flex>
    </v-layout>

    <div class="d-flex justify-end mt-6">
      <v-btn
        large
        color="primary"
        class="float-right"
        :disabled="!isDataLoaded"
        @click="save"
      >
        <span class="mr-2">Save</span>
        <v-icon>mdi-content-save-all</v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script>
import { load, store } from "../chrome";
import DialogReplaceResource from "./DialogReplaceResource.vue";

export default {
  components: { DialogReplaceResource },
  data() {
    return {
      isDataLoaded: false,

      showSecret: false,
      secret: "",
      skin: "",
      logLevels: "",

      replaceResources: [],

      rules: {
        required: v => !!v || "Required.",
        min: len => v => v.length >= len || `Min ${len} characters`,
        logLevels: v => {
          if (!v) return true;

          // TODO Rumen - if needed
          // const levels = parseLoggerlevels(v);
          return true; //"The loggers levels is so not correct format";
        }
      },

      editingReplaceResource: null
    };
  },

  async mounted() {
    this.isDataLoaded = true;

    const loadedData = await load();
    if (!loadedData.replaceResources) loadedData.replaceResources = [];
    // merge it in the component's data
    Object.assign(this.$data, loadedData);
  },

  methods: {
    save() {
      store(this.$data);
    },

    editReplaceResource(resource) {
      // open the Edit dialog
      this.editingReplaceResource = resource;
    },
    deleteReplaceResource(resource) {
      const index = this.replaceResources.indexOf(resource);
      confirm("Are you sure you want to delete this item?") &&
        this.replaceResources.splice(index, 1);
    },
    onSaveReplaceResource(replaceResource) {
      if (this.editingReplaceResource) {
        // edited
        const index = this.replaceResources.indexOf(
          this.editingReplaceResource
        );
        Object.assign(this.replaceResources[index], replaceResource);
        this.editingReplaceResource = null;
      } else {
        // new
        this.replaceResources.push(replaceResource);
      }
    }
  }
};
</script>
