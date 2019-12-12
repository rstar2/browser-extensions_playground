<template>
    <v-container style="position: relative">
        <div v-if="!isDataLoaded" class="overlayDisable"></div>

        <v-layout column>
            <v-flex mt-6>
                <v-img :src="require('../assets/app_icon.png')" class="my-3" contain height="100"></v-img>
            </v-flex>

            <v-flex text-center mb-6>
                <h1 class="display-2 font-weight mb-3">
                    FFS Extension Settings
                </h1>
            </v-flex>

            <v-flex>
                <h2 class="headline font-weight-bold mb-3">Authorization</h2>

                <v-text-field label="Secret key" clearable v-model="secret"
                              :type="showSecret ? 'text' : 'password'"
                              :append-icon="showSecret ? 'mdi-eye' : 'mdi-eye-off'"
                              @click:append="showSecret = !showSecret"
                              :rules="[rules.required, rules.min(3)]">

                </v-text-field>
            </v-flex>

            <v-flex>
                <h2 class="headline font-weight-bold mb-3">Skin</h2>
                <v-text-field label="Skin" clearable v-model="skin"></v-text-field>
            </v-flex>

            <v-flex>
                <h2 class="headline font-weight-bold mb-3">Loggers</h2>
                <v-text-field label="Logger levels" clearable v-model="logLevels"
                              hint="logger1:level, logger2:level, ..." :rules="[rules.logLevels]">
                </v-text-field>
            </v-flex>

            <v-flex>
                <h2 class="headline font-weight-bold mb-3">Replaced scripts</h2>
            </v-flex>
        </v-layout>

        <v-btn large color="primary" class="float-right" :disabled="!isDataLoaded" @click="save">
            <span class="mr-2">Save</span>
            <v-icon>mdi-content-save-all</v-icon>
        </v-btn>
    </v-container>
</template>

<script>
    import {load, store} from '../chrome';

    export default {
        data() {
            return {
                isDataLoaded: false,
                showSecret: false,
                secret: '',
                skin: '',
                logLevels: '',
                rules: {
                    required: v => !!v || "Required.",
                    min: len => v => v.length >= len || `Min ${len} characters`,
                    logLevels: v => {
                        if (!v) return true;

                        // TODO Rumen - if needed
                        // const levels = parseLoggerlevels(v);
                        return true; //"The loggers levels is so not correct format";
                    }
                }
            };
        },

        async mounted() {
            const loadedData = await load();
            // merge it in the component's data
            Object.assign(this.$data, loadedData);
            this.isDataLoaded = true;
        },

        methods: {
            save() {
                store(this.$data);
            }
        }
    };
</script>

<style scoped>
    .overlayDisable {
        position: absolute;
        z-index: 1;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: #FFF;
        opacity: 0.5;
        cursor: wait;
    }
</style>
