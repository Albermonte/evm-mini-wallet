import { createApp } from "vue";
import { WagmiPlugin } from "@wagmi/vue";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { config } from "./config/wagmi";
import App from "./App.vue";
import "./style.css";

const app = createApp(App);
app.use(WagmiPlugin, { config });
app.use(VueQueryPlugin);
app.mount("#app");
