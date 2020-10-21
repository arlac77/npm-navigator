<script>
  import * as style from "./main.css";
  import base from 'consts:base';
  import { Router, Route, Outlet } from "svelte-guard-history-router";
  import { TopNav } from "svelte-common";
  import About from "./pages/About.svelte";
  import Home from "./pages/Home.svelte";
  import Packages from "./pages/Packages.svelte";

</script>

<Router {base}>
  <TopNav offset={42}>
    <Route href="/" path="*" component={Home}>
      <img class="logo" src="images/npm.png" alt="Package Navigator" />
      Package Navigator
    </Route>
    <ul class="left">
      <li>
        <Route path="/packages" component={Packages}>
          Packages
          <Route path="/:package" component={Packages}/>
        </Route>
      </li>
    </ul>
    <ul>
      <Route path="/about" component={About}>About</Route>
    </ul>
  </TopNav>
  <main>
    <Outlet />
  </main>
</Router>
