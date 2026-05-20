# TypeSpec Notation Reference

TypeSpec is used here as a **modeling language only** — no compilation, no toolchain. Write contracts in `typespec` code blocks as documentation.

## Table of Contents

1. [Basic Structure](#basic-structure)
2. [HTTP Method Decorators](#http-method-decorators)
3. [Parameter Decorators](#parameter-decorators)
4. [Response & Status Codes](#response--status-codes)
5. [Scalar Types](#scalar-types)
6. [Models](#models)
7. [Enums & Unions](#enums--unions)
8. [Routing](#routing)
9. [Constraints & Validation](#constraints--validation)
10. [Common Patterns](#common-patterns)
11. [Gotchas](#gotchas)

---

## Basic Structure

```typespec
@route("/resource")
namespace ResourceName {
  @get op list(): Resource[];
  @post op create(@body body: CreateResourceRequest): Resource;

  @route("/{id}") {
    @get op get(@path id: string): Resource;
    @put op update(@path id: string, @body body: UpdateResourceRequest): Resource;
    @delete op delete(@path id: string): void;
  }
}

model Resource {
  id: string;
  name: string;
}

model CreateResourceRequest {
  name: string;
}

model UpdateResourceRequest {
  name?: string;
}
```

---

## HTTP Method Decorators

| Decorator | HTTP Verb | Default when    |
| --------- | --------- | --------------- |
| `@get`    | GET       | No body present |
| `@post`   | POST      | Body present    |
| `@put`    | PUT       | Full replace    |
| `@patch`  | PATCH     | Partial update  |
| `@delete` | DELETE    | —               |
| `@head`   | HEAD      | —               |

Always be explicit — don't rely on defaults.

---

## Parameter Decorators

### `@path` — URI path parameters

```typespec
@route("/pets/{id}")
op get(@path id: string): Pet;
```

### `@query` — Query string parameters

```typespec
op list(@query page?: int32, @query pageSize?: int32): Pet[];
op search(@query(#{ explode: true }) tags: string[]): Pet[];  // multi-value
```

### `@body` — Request/response body

```typespec
op create(@body body: CreatePetRequest): Pet;
```

### `@header` — HTTP headers

```typespec
op read(@header authorization: string): Pet;
op create(): { @header("Location") location: string; @body pet: Pet; };
// camelCase → kebab-case automatically: contentType → content-type
```

---

## Response & Status Codes

### Explicit status codes

```typespec
op create(@body body: CreatePetRequest): {
  @statusCode _: 201;
  @body pet: Pet;
};
```

### Default status codes

- Normal response → `200`
- `void` return → `204 No Content`

### Error responses

```typespec
model Error {
  code: int32;
  message: string;
}

op update(@body body: UpdatePetRequest): Pet | Error;
// Generates 200 and "default" responses
```

### Standard response shortcuts

```typespec
// From TypeSpec.Http — use these where appropriate
OkResponse           // 200
CreatedResponse      // 201
AcceptedResponse     // 202
NoContentResponse    // 204
NotFoundResponse     // 404
UnauthorizedResponse // 401
ConflictResponse     // 409
```

---

## Scalar Types

### Numeric

| Type      | Maps to            |
| --------- | ------------------ |
| `int32`   | integer (32-bit)   |
| `int64`   | integer (64-bit)   |
| `float32` | number (float)     |
| `float64` | number (double)    |
| `uint8`   | integer (unsigned) |

### String & Other

| Type          | Notes                  |
| ------------- | ---------------------- |
| `string`      | plain string           |
| `boolean`     | true/false             |
| `utcDateTime` | RFC 3339 UTC timestamp |
| `plainDate`   | date only (no time)    |
| `url`         | URI format             |
| `bytes`       | binary data            |
| `unknown`     | untyped                |

---

## Models

### Required vs optional fields

```typespec
model Pet {
  id: string;          // required
  name: string;        // required
  age?: int32;         // optional
  color?: string = "white";  // optional with default
}
```

### Model composition

```typespec
// Spread — copy properties, no inheritance
model Animal { species: string; }
model Dog { ...Animal; name: string; }

// Extends — nominal inheritance
model Dog extends Animal { name: string; }
```

### Additional properties

```typespec
model Config {
  debug?: boolean;
  ...Record<string>;  // allows any extra string properties
}
```

---

## Enums & Unions

### Enum

```typespec
enum Status {
  Active,
  Inactive,
  Pending,
}

enum Color {
  "red",
  "blue",
  "green",
}
```

### String literal union (preferred for simple cases)

```typespec
model Pet {
  status: "active" | "inactive" | "pending";
  size: "small" | "medium" | "large";
}
```

### Discriminated union (polymorphism)

```typespec
@discriminator("kind")
union Animal {
  cat: Cat,
  dog: Dog,
}

model Cat { kind: "cat"; meow?: string; }
model Dog { kind: "dog"; bark?: string; }
```

---

## Routing

### Nested routes

```typespec
@route("/users")
namespace Users {
  @get op list(): User[];

  @route("/{userId}/pets")
  namespace Pets {
    @get op list(@path userId: string): Pet[];
  }
}
// → GET /users, GET /users/{userId}/pets
```

### Reusable path params

```typespec
model UserId { @path userId: string; }

op getPets(...UserId): Pet[];   // spread into operation
```

---

## Constraints & Validation

```typespec
model Pet {
  @minLength(1) @maxLength(100)
  name: string;

  @minValue(0) @maxValue(120)
  age?: int32;

  @pattern("^#[0-9A-Fa-f]{6}$")
  color?: string;

  @minItems(1) @maxItems(10)
  tags?: string[];
}
```

---

## Common Patterns

### CRUD namespace

```typespec
@route("/items")
namespace Items {
  @get    op list(): Item[];
  @post   op create(@body body: CreateItemRequest): Item;

  @route("/{id}") {
    @get    op get(@path id: string): Item;
    @put    op update(@path id: string, @body body: UpdateItemRequest): Item;
    @delete op delete(@path id: string): void;
  }
}
```

### Paginated list

```typespec
model PagedResult<T> {
  items: T[];
  total: int32;
  page: int32;
  pageSize: int32;
}

op list(@query page?: int32, @query pageSize?: int32): PagedResult<Item>;
```

### Create returns 201 with Location header

```typespec
op create(@body body: CreateItemRequest): {
  @statusCode _: 201;
  @header("Location") location: string;
  @body item: Item;
};
```

### Partial update (PATCH)

```typespec
model UpdateItemRequest {
  name?: string;
  description?: string;
  // all fields optional for PATCH
}

@patch op update(@path id: string, @body body: UpdateItemRequest): Item;
```

---

## Gotchas

1. **PATCH makes fields implicitly optional** — TypeSpec's emitter treats PATCH body fields as optional by default even if not marked `?`. Mark them explicitly in the model to be clear.

2. **Header name conversion** — camelCase properties become kebab-case header names automatically (`contentType` → `content-type`). Use `@header("X-Custom")` to override.

3. **`void` return → 204** — returning `void` from a delete/action operation signals no response body, generating `204 No Content`.

4. **Path param matching** — if the `@route` template contains `{id}`, the operation must have a `@path id` parameter with the same name.

5. **Union with Error** — `Pet | Error` generates a `200` response for `Pet` and a `default` error response for `Error`. Use explicit `@statusCode` when you need specific error codes (400, 404, etc.).
