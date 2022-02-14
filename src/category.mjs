import { FetchCommand } from "svelte-command";
import { api } from "./constants.mjs";
import { session, headers } from "./util.mjs";

export async function* categoryIterator(transition) {
  if (this.categories) {
    yield* this.categories;
  } else {
    const categories = [];

    //this.categories = categories;
    //transition.context.categories = categories;

    const response = await fetch(`${api}/category`, {
      headers: headers(session)
    });

    if (!response.ok) {
      throw response;
    }

    for (const c of await response.json()) {
      const category = new Category(c);
      categories.push(category);
      yield category;
    }
  }
}

export async function* valueIterator(transition) {
  const response = await fetch(
    `${api}/category/${transition.params.category}/value`,
    {
      headers: headers(session)
    }
  );

  if (!response.ok) {
    throw response;
  }

  for (const value of await response.json()) {
    yield value;
  }
}

export class Meter {
  constructor(category, json) {
    this.category = category;
    Object.assign(this, json);
  }
}

export class Note {
  constructor(category, json) {
    this.category = category;
    Object.assign(this, json);
  }
}

export class Category {
  constructor(json = {}) {
    this.name = json.name;
    this.unit = json.unit;
    this.description = json.description;
    this.fractionalDigits = json.fractionalDigits || 2;
    this.order = json.order || 1.0;

    Object.defineProperties(this, {
      _latestSubscriptions: { value: new Set() },
      _valuesSubscriptions: { value: new Set() }
    });
  }

  get url() {
    return `${api}/category/${this.name}`;
  }

  async *meters() {
    const response = await fetch(`${this.url}/meters`, {
      headers: headers(session)
    });
    if (!response.ok) {
      throw response;
    }

    for (const item of await response.json()) {
      yield new Meter(this, item);
    }
  }

  async *notes() {
    const response = await fetch(`${this.url}/notes`, {
      headers: headers(session)
    });

    if (!response.ok) {
      throw response;
    }

    for (const item of await response.json()) {
      yield new Note(this, item);
    }
  }

  get deleteCommand() {
    return new FetchCommand(
      this.url,
      {
        method: "DELETE",
        headers: headers(session)
      },
      { title: "Delete", shortcuts: "alt+d" }
    );
  }

  get saveCommand() {
    return new FetchCommand(
      () => this.url,
      () => {
        return {
          method: "PUT",
          headers: headers(session),
          body: JSON.stringify({
            order: this.order,
            unit: this.unit,
            fractionalDigits: parseInt(this.fractionalDigits),
            description: this.description
          })
        };
      },
      { title: "Save", shortcuts: "alt+s" }
    );
  }

  async _latest() {
    const response = await fetch(`${this.url}/value?reverse=1&limit=1`, {
      headers: headers(session)
    });

    if (!response.ok) {
      throw response;
    }

    const entry = (await response.json())[0];
    this._latestSubscriptions.forEach(subscription => subscription(entry));
  }

  get latest() {
    return {
      subscribe: subscription => {
        this._latestSubscriptions.add(subscription);
        subscription(undefined);
        this._latest();
        return () => this._latestSubscriptions.delete(subscription);
      }
    };
  }

  async _values() {
    const response = await fetch(`${this.url}/value`, {
      headers: headers(session)
    });

    if (!response.ok) {
      throw response;
    }

    const values = await response.json();
    this._valuesSubscriptions.forEach(subscription => subscription(values));
  }

  get values() {
    return {
      subscribe: subscription => {
        this._valuesSubscriptions.add(subscription);
        subscription([]);
        this._values();
        return () => this._valuesSubscriptions.delete(subscription);
      }
    };
  }

  insertCommand(values) {
    return new FetchCommand(
      `${this.url}/value`,
      () => {
        const v = values();
        return {
          method: "POST",
          headers: headers(session),
          body: JSON.stringify({ value: v[0], time: v[1].getTime() })
        };
      },
      { title: `Insert ${this.name}` }
    );
  }

  /**
   * Delete one value from category.
   *
   * @param key database key which should be delete
   */
  deleteValueCommand(key, responseHandler) {
    return new FetchCommand(
      `${this.url}/value`,
      () => {
        return {
          method: "DELETE",
          headers: headers(session),
          body: JSON.stringify({ key: key })
        };
      },
      {
        title: "Delete",
        // TODO commands should act like promises
        responseHandler
      }
    );
  }
}
