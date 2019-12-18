<template>
  <v-dialog v-model="isActive" max-width="500px">
    <template v-slot:activator="{ on }">
      <v-btn color="primary" dark class="mb-2" v-on="on">New</v-btn>
    </template>
    <v-card>
      <v-card-title>
        <span class="headline">{{ title }}</span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" lazy-validation>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="activeItem.key"
                  label="Original"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="activeItem.value"
                  label="Replaced"
                  :rules="[rules.required]"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close">Cancel</v-btn>
        <v-btn color="blue darken-1" text @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const defaultItem = {
  key: "",
  value: ""
};
export default {
  props: {
    editItem: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      isActive: false,
      activeItem: { ...defaultItem },

      rules: {
        required: v => !!v || "Required."
      }
    };
  },
  computed: {
    title() {
      if (this.editItem) {
        return "Edit";
      }
      return "Create";
    }
  },
  watch: {
    editItem: {
      immediate: true,
      handler(value) {
        if (value) {
          this.isActive = true;
        }
      }
    },
    isActive(value) {
      if (value) {
        this.activeItem = { ...defaultItem, ...this.editItem };
        // on the first showing the dialog (e.g. when 'isActive' becomes 'true') the form is still not present
        if (this.$refs.form) {
            this.$refs.form.resetValidation();
        }
      }
    }
  },
  methods: {
    close() {
      // close the dialog
      this.isActive = false;
      this.$emit("close");
    },
    save() {
      if (this.$refs.form.validate()) {
        // clone just in case
        this.$emit("action", { ...this.activeItem });
        this.close();
      }
    }
  }
};
</script>
