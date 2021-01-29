import {html} from "htl";
import {arrayify} from "./array.js";
import {preventDefault} from "./event.js";
import {formatNumber, stringify} from "./format.js";
import {maybeLabel} from "./label.js";

export function Search(data, {
  format = length => `${formatNumber(length)} result${length === 1 ? "" : "s"}`, // length format
  label,
  query = "", // initial search query
  placeholder = "Search", // placeholder text to show when empty
  columns = data.columns,
  spellcheck,
  filter = columns === undefined ? searchFilter : columnFilter(columns), // returns the filter function given query
  style = {}
} = {}) {
  let value = [];
  data = arrayify(data);
  const {width, ...formStyle} = style;
  const form = html`<form class=__ns__ style=${formStyle} onsubmit=${preventDefault}>
    ${maybeLabel(label)}<div class=__ns__-input>
      <input name=input type=search spellcheck=${spellcheck === undefined ? false : spellcheck + ""} style=${{width}} placeholder=${placeholder} value=${query} oninput=${oninput}>
      <output name=output>
    </div>
  </form>`;
  const {input, output} = form.elements;
  function oninput() {
    value = data.filter(filter(input.value));
    if (columns !== undefined) value.columns = columns;
    output.value = input.value ? format(value.length) : "";
  }
  oninput();
  return Object.defineProperties(form, {
    value: {
      get() {
        return value;
      }
    },
    query: {
      get() {
        return query;
      },
      set(v) {
        query = input.value = stringify(v);
        oninput();
      }
    }
  });
}

export function searchFilter(query) {
  const filters = (query + "").split(/\s+/g).filter(t => t).map(termFilter);
  return d => {
    if (d == null) return false;
    if (typeof d === "object") {
      out: for (const filter of filters) {
        for (const value of valuesof(d)) {
          if (filter.test(value)) {
            continue out;
          }
        }
        return false;
      }
    } else {
      for (const filter of filters) {
        if (!filter.test(d)) {
          return false;
        }
      }
    }
    return true;
  };
}

function columnFilter(columns) {
  return query => {
    const filters = (query + "").split(/\s+/g).filter(t => t).map(termFilter);
    return d => {
      out: for (const filter of filters) {
        for (const column of columns) {
          if (filter.test(d[column])) {
            continue out;
          }
        }
        return false;
      }
      return true;
    };
  };
}

function* valuesof(d) {
  for (const key in d) {
    yield d[key];
  }
}

function termFilter(term) {
  return new RegExp(`\\b${escapeRegExp(term)}`, "i");
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
