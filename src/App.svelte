<script>
  import * as style from "./main.css";
  import base from 'consts:base';
  import { Router, Route, Outlet } from "svelte-guard-history-router";
  import { Menue } from "svelte-common";
  import About from "./pages/About.svelte";
  import Home from "./pages/Home.svelte";
  import Packages from "./pages/Packages.svelte";

</script>

<Router {base}>
  <nav>
    <Route href="/" path="*" component={Home}>
      <img class="logo" src="images/logo.svg" alt="Package Navigator" />
      Package Navigator
    </Route>
    <ul class="left">
      <li>
        <Route path="/packages" component={Packages}>
          Packages
        </Route>
      </li>
    </ul>
    <ul>
      <Route path="/about" component={About}>About</Route>
    </ul>
  </nav>
  <main>
    <Outlet />
  </main>
</Router>
