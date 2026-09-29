import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// renderer/model.ts
import { randomUUID } from "node:crypto";
function fresh() {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return { id: randomUUID(), revision: 0, number: "", date: today, due: today, company: "", companyAddress: "", customer: "", customerAddress: "", currency: "GBP", taxRate: "0", payment: "", notes: "", items: [{ description: "", quantity: "1", price: "0.00" }] };
}
function decimal(value, places, label) {
  if (typeof value !== "string" || !new RegExp("^\\d{1,9}(?:\\.\\d{1," + places + "})?$").test(value)) throw Error(`${label}: enter a positive decimal with at most ${places} decimal places.`);
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10n ** BigInt(places) + BigInt(fraction.padEnd(places, "0"));
}
function validate(input, complete = false) {
  if (!input || typeof input !== "object") throw Error("Invalid invoice.");
  const d = input;
  if (typeof d.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.id) || !Number.isSafeInteger(d.revision) || d.revision < 0) throw Error("Invalid draft identity.");
  for (const k of ["number", "date", "due", "company", "companyAddress", "customer", "customerAddress", "currency", "taxRate", "payment", "notes"]) {
    if (typeof d[k] !== "string" || d[k].length > (["companyAddress", "customerAddress", "payment", "notes"].includes(k) ? 500 : 100)) throw Error(`Invalid ${k}.`);
  }
  if (!["GBP", "EUR", "USD"].includes(d.currency)) throw Error("Choose GBP, EUR or USD.");
  for (const k of ["date", "due"]) if (!/^\d{4}-\d{2}-\d{2}$/.test(d[k]) || Number.isNaN(Date.parse(d[k])) || new Date(d[k]).toISOString().slice(0, 10) !== d[k]) throw Error(`Invalid ${k}; use YYYY-MM-DD.`);
  if (d.due < d.date) throw Error("Due date must be on or after invoice date.");
  if (decimal(d.taxRate, 2, "Tax rate") > 10000n) throw Error("Tax rate must be between 0 and 100.");
  if (!Array.isArray(d.items) || d.items.length < 1 || d.items.length > 100) throw Error("Use 1 to 100 invoice lines.");
  for (const line of d.items) {
    if (!line || typeof line.description !== "string" || line.description.length > 200) throw Error("Descriptions must be at most 200 characters.");
    if (decimal(line.quantity, 3, "Quantity") === 0n) throw Error("Quantity must be greater than zero.");
    decimal(line.price, 2, "Price");
    if (complete && !line.description.trim()) throw Error("Add a description to each line.");
  }
  if (complete && (!d.company.trim() || !d.customer.trim())) throw Error("Add your business and customer names.");
  const result = totals(d);
  if (result.total > 99999999999n) throw Error("Invoice exceeds the supported total.");
  return {
    id: d.id,
    revision: d.revision,
    number: d.number,
    date: d.date,
    due: d.due,
    company: d.company,
    companyAddress: d.companyAddress,
    customer: d.customer,
    customerAddress: d.customerAddress,
    currency: d.currency,
    taxRate: d.taxRate,
    payment: d.payment,
    notes: d.notes,
    items: d.items.map(({ description, quantity, price }) => ({ description, quantity, price }))
  };
}
function totals(d) {
  const lines = d.items.map((x) => (decimal(x.quantity, 3, "Quantity") * decimal(x.price, 2, "Price") + 500n) / 1000n);
  const subtotal = lines.reduce((a, b) => a + b, 0n);
  const tax = (subtotal * decimal(d.taxRate, 2, "Tax rate") + 5000n) / 10000n;
  return { lines, subtotal, tax, total: subtotal + tax };
}
function money(value, currency) {
  return `${currency} ${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}
var init_model = __esm({
  "renderer/model.ts"() {
    "use strict";
  }
});

// node_modules/@formepdf/react/dist/components.js
function Document(_props) {
  return null;
}
function Page(_props) {
  return null;
}
function View(_props) {
  return null;
}
function Text(_props) {
  return null;
}
function H1(_props) {
  return null;
}
function H2(_props) {
  return null;
}
function H3(_props) {
  return null;
}
function H4(_props) {
  return null;
}
function H5(_props) {
  return null;
}
function H6(_props) {
  return null;
}
function OrderedList(_props) {
  return null;
}
function UnorderedList(_props) {
  return null;
}
function ListItem(_props) {
  return null;
}
function Strong(_props) {
  return null;
}
function Em(_props) {
  return null;
}
function Code(_props) {
  return null;
}
function Link(_props) {
  return null;
}
function Image(_props) {
  return null;
}
function Table(_props) {
  return null;
}
function Row(_props) {
  return null;
}
function Cell(_props) {
  return null;
}
function Fixed(_props) {
  return null;
}
function Svg(_props) {
  return null;
}
function QrCode(_props) {
  return null;
}
function Barcode(_props) {
  return null;
}
function Canvas(_props) {
  return null;
}
function Watermark(_props) {
  return null;
}
function PageBreak(_props) {
  return null;
}
function BarChart(_props) {
  return null;
}
function LineChart(_props) {
  return null;
}
function PieChart(_props) {
  return null;
}
function AreaChart(_props) {
  return null;
}
function DotPlot(_props) {
  return null;
}
function TextField(_props) {
  return null;
}
function Checkbox(_props) {
  return null;
}
function Dropdown(_props) {
  return null;
}
function RadioButton(_props) {
  return null;
}
var init_components = __esm({
  "node_modules/@formepdf/react/dist/components.js"() {
    "use strict";
    Document.__formeType = "Document";
  }
});

// node_modules/react/cjs/react.production.js
var require_react_production = __commonJS({
  "node_modules/react/cjs/react.production.js"(exports) {
    "use strict";
    /**
     * @license React
     * react.production.js
     *
     * Copyright (c) Meta Platforms, Inc. and affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */
    var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
    var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
    var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
    var REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode");
    var REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler");
    var REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer");
    var REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context");
    var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref");
    var REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense");
    var REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo");
    var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
    var REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity");
    var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
    function getIteratorFn(maybeIterable) {
      if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
      maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
      return "function" === typeof maybeIterable ? maybeIterable : null;
    }
    var ReactNoopUpdateQueue = {
      isMounted: function() {
        return false;
      },
      enqueueForceUpdate: function() {
      },
      enqueueReplaceState: function() {
      },
      enqueueSetState: function() {
      }
    };
    var assign = Object.assign;
    var emptyObject = {};
    function Component(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    Component.prototype.isReactComponent = {};
    Component.prototype.setState = function(partialState, callback) {
      if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
        throw Error(
          "takes an object of state variables to update or a function which returns an object of state variables."
        );
      this.updater.enqueueSetState(this, partialState, callback, "setState");
    };
    Component.prototype.forceUpdate = function(callback) {
      this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
    };
    function ComponentDummy() {
    }
    ComponentDummy.prototype = Component.prototype;
    function PureComponent(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
    pureComponentPrototype.constructor = PureComponent;
    assign(pureComponentPrototype, Component.prototype);
    pureComponentPrototype.isPureReactComponent = true;
    var isArrayImpl = Array.isArray;
    function noop() {
    }
    var ReactSharedInternals = { H: null, A: null, T: null, S: null };
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function ReactElement(type, key, props) {
      var refProp = props.ref;
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref: void 0 !== refProp ? refProp : null,
        props
      };
    }
    function cloneAndReplaceKey(oldElement, newKey) {
      return ReactElement(oldElement.type, newKey, oldElement.props);
    }
    function isValidElement3(object) {
      return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    function escape(key) {
      var escaperLookup = { "=": "=0", ":": "=2" };
      return "$" + key.replace(/[=:]/g, function(match) {
        return escaperLookup[match];
      });
    }
    var userProvidedKeyEscapeRegex = /\/+/g;
    function getElementKey(element, index) {
      return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
    }
    function resolveThenable(thenable) {
      switch (thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
        default:
          switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
            function(fulfilledValue) {
              "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
            },
            function(error) {
              "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
            }
          )), thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
          }
      }
      throw thenable;
    }
    function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
      var type = typeof children;
      if ("undefined" === type || "boolean" === type) children = null;
      var invokeCallback = false;
      if (null === children) invokeCallback = true;
      else
        switch (type) {
          case "bigint":
          case "string":
          case "number":
            invokeCallback = true;
            break;
          case "object":
            switch (children.$$typeof) {
              case REACT_ELEMENT_TYPE:
              case REACT_PORTAL_TYPE:
                invokeCallback = true;
                break;
              case REACT_LAZY_TYPE:
                return invokeCallback = children._init, mapIntoArray(
                  invokeCallback(children._payload),
                  array,
                  escapedPrefix,
                  nameSoFar,
                  callback
                );
            }
        }
      if (invokeCallback)
        return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
          return c;
        })) : null != callback && (isValidElement3(callback) && (callback = cloneAndReplaceKey(
          callback,
          escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(
            userProvidedKeyEscapeRegex,
            "$&/"
          ) + "/") + invokeCallback
        )), array.push(callback)), 1;
      invokeCallback = 0;
      var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
      if (isArrayImpl(children))
        for (var i = 0; i < children.length; i++)
          nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if (i = getIteratorFn(children), "function" === typeof i)
        for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
          nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if ("object" === type) {
        if ("function" === typeof children.then)
          return mapIntoArray(
            resolveThenable(children),
            array,
            escapedPrefix,
            nameSoFar,
            callback
          );
        array = String(children);
        throw Error(
          "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
        );
      }
      return invokeCallback;
    }
    function mapChildren(children, func, context) {
      if (null == children) return children;
      var result = [], count = 0;
      mapIntoArray(children, result, "", "", function(child) {
        return func.call(context, child, count++);
      });
      return result;
    }
    function lazyInitializer(payload) {
      if (-1 === payload._status) {
        var ctor = payload._result;
        ctor = ctor();
        ctor.then(
          function(moduleObject) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 1, payload._result = moduleObject;
          },
          function(error) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 2, payload._result = error;
          }
        );
        -1 === payload._status && (payload._status = 0, payload._result = ctor);
      }
      if (1 === payload._status) return payload._result.default;
      throw payload._result;
    }
    var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
      if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
        var event = new window.ErrorEvent("error", {
          bubbles: true,
          cancelable: true,
          message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
          error
        });
        if (!window.dispatchEvent(event)) return;
      } else if ("object" === typeof process && "function" === typeof process.emit) {
        process.emit("uncaughtException", error);
        return;
      }
      console.error(error);
    };
    var Children2 = {
      map: mapChildren,
      forEach: function(children, forEachFunc, forEachContext) {
        mapChildren(
          children,
          function() {
            forEachFunc.apply(this, arguments);
          },
          forEachContext
        );
      },
      count: function(children) {
        var n = 0;
        mapChildren(children, function() {
          n++;
        });
        return n;
      },
      toArray: function(children) {
        return mapChildren(children, function(child) {
          return child;
        }) || [];
      },
      only: function(children) {
        if (!isValidElement3(children))
          throw Error(
            "React.Children.only expected to receive a single React element child."
          );
        return children;
      }
    };
    exports.Activity = REACT_ACTIVITY_TYPE;
    exports.Children = Children2;
    exports.Component = Component;
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.Profiler = REACT_PROFILER_TYPE;
    exports.PureComponent = PureComponent;
    exports.StrictMode = REACT_STRICT_MODE_TYPE;
    exports.Suspense = REACT_SUSPENSE_TYPE;
    exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
    exports.__COMPILER_RUNTIME = {
      __proto__: null,
      c: function(size) {
        return ReactSharedInternals.H.useMemoCache(size);
      }
    };
    exports.cache = function(fn) {
      return function() {
        return fn.apply(null, arguments);
      };
    };
    exports.cacheSignal = function() {
      return null;
    };
    exports.cloneElement = function(element, config, children) {
      if (null === element || void 0 === element)
        throw Error(
          "The argument must be a React element, but you passed " + element + "."
        );
      var props = assign({}, element.props), key = element.key;
      if (null != config)
        for (propName in void 0 !== config.key && (key = "" + config.key), config)
          !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
      var propName = arguments.length - 2;
      if (1 === propName) props.children = children;
      else if (1 < propName) {
        for (var childArray = Array(propName), i = 0; i < propName; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      return ReactElement(element.type, key, props);
    };
    exports.createContext = function(defaultValue) {
      defaultValue = {
        $$typeof: REACT_CONTEXT_TYPE,
        _currentValue: defaultValue,
        _currentValue2: defaultValue,
        _threadCount: 0,
        Provider: null,
        Consumer: null
      };
      defaultValue.Provider = defaultValue;
      defaultValue.Consumer = {
        $$typeof: REACT_CONSUMER_TYPE,
        _context: defaultValue
      };
      return defaultValue;
    };
    exports.createElement = function(type, config, children) {
      var propName, props = {}, key = null;
      if (null != config)
        for (propName in void 0 !== config.key && (key = "" + config.key), config)
          hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
      var childrenLength = arguments.length - 2;
      if (1 === childrenLength) props.children = children;
      else if (1 < childrenLength) {
        for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      if (type && type.defaultProps)
        for (propName in childrenLength = type.defaultProps, childrenLength)
          void 0 === props[propName] && (props[propName] = childrenLength[propName]);
      return ReactElement(type, key, props);
    };
    exports.createRef = function() {
      return { current: null };
    };
    exports.forwardRef = function(render2) {
      return { $$typeof: REACT_FORWARD_REF_TYPE, render: render2 };
    };
    exports.isValidElement = isValidElement3;
    exports.lazy = function(ctor) {
      return {
        $$typeof: REACT_LAZY_TYPE,
        _payload: { _status: -1, _result: ctor },
        _init: lazyInitializer
      };
    };
    exports.memo = function(type, compare) {
      return {
        $$typeof: REACT_MEMO_TYPE,
        type,
        compare: void 0 === compare ? null : compare
      };
    };
    exports.startTransition = function(scope) {
      var prevTransition = ReactSharedInternals.T, currentTransition = {};
      ReactSharedInternals.T = currentTransition;
      try {
        var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
        null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
        "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
      } catch (error) {
        reportGlobalError(error);
      } finally {
        null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
      }
    };
    exports.unstable_useCacheRefresh = function() {
      return ReactSharedInternals.H.useCacheRefresh();
    };
    exports.use = function(usable) {
      return ReactSharedInternals.H.use(usable);
    };
    exports.useActionState = function(action, initialState, permalink) {
      return ReactSharedInternals.H.useActionState(action, initialState, permalink);
    };
    exports.useCallback = function(callback, deps) {
      return ReactSharedInternals.H.useCallback(callback, deps);
    };
    exports.useContext = function(Context) {
      return ReactSharedInternals.H.useContext(Context);
    };
    exports.useDebugValue = function() {
    };
    exports.useDeferredValue = function(value, initialValue) {
      return ReactSharedInternals.H.useDeferredValue(value, initialValue);
    };
    exports.useEffect = function(create, deps) {
      return ReactSharedInternals.H.useEffect(create, deps);
    };
    exports.useEffectEvent = function(callback) {
      return ReactSharedInternals.H.useEffectEvent(callback);
    };
    exports.useId = function() {
      return ReactSharedInternals.H.useId();
    };
    exports.useImperativeHandle = function(ref, create, deps) {
      return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
    };
    exports.useInsertionEffect = function(create, deps) {
      return ReactSharedInternals.H.useInsertionEffect(create, deps);
    };
    exports.useLayoutEffect = function(create, deps) {
      return ReactSharedInternals.H.useLayoutEffect(create, deps);
    };
    exports.useMemo = function(create, deps) {
      return ReactSharedInternals.H.useMemo(create, deps);
    };
    exports.useOptimistic = function(passthrough, reducer) {
      return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
    };
    exports.useReducer = function(reducer, initialArg, init) {
      return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
    };
    exports.useRef = function(initialValue) {
      return ReactSharedInternals.H.useRef(initialValue);
    };
    exports.useState = function(initialState) {
      return ReactSharedInternals.H.useState(initialState);
    };
    exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
      return ReactSharedInternals.H.useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
      );
    };
    exports.useTransition = function() {
      return ReactSharedInternals.H.useTransition();
    };
    exports.version = "19.2.5";
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports, module) {
    "use strict";
    if (true) {
      module.exports = require_react_production();
    } else {
      module.exports = null;
    }
  }
});

// node_modules/@formepdf/react/dist/charts.js
var import_react;
var init_charts = __esm({
  "node_modules/@formepdf/react/dist/charts.js"() {
    "use strict";
    import_react = __toESM(require_react(), 1);
    init_components();
  }
});

// node_modules/@formepdf/shared/dist/style.js
function mapStyle(style) {
  if (!style)
    return {};
  const result = {};
  if (style.width !== void 0)
    result.width = mapDimension(style.width);
  if (style.height !== void 0)
    result.height = mapDimension(style.height);
  if (style.minWidth !== void 0)
    result.minWidth = mapDimension(style.minWidth);
  if (style.minHeight !== void 0)
    result.minHeight = mapDimension(style.minHeight);
  if (style.maxWidth !== void 0)
    result.maxWidth = mapDimension(style.maxWidth);
  if (style.maxHeight !== void 0)
    result.maxHeight = mapDimension(style.maxHeight);
  if (style.padding !== void 0 || style.paddingTop !== void 0 || style.paddingRight !== void 0 || style.paddingBottom !== void 0 || style.paddingLeft !== void 0 || style.paddingHorizontal !== void 0 || style.paddingVertical !== void 0) {
    const base = style.padding !== void 0 ? expandEdges(style.padding) : { top: 0, right: 0, bottom: 0, left: 0 };
    const vt = style.paddingVertical ?? base.top;
    const vb = style.paddingVertical ?? base.bottom;
    const hl = style.paddingHorizontal ?? base.left;
    const hr = style.paddingHorizontal ?? base.right;
    result.padding = {
      top: style.paddingTop ?? vt,
      right: style.paddingRight ?? hr,
      bottom: style.paddingBottom ?? vb,
      left: style.paddingLeft ?? hl
    };
  }
  if (style.margin !== void 0 || style.marginTop !== void 0 || style.marginRight !== void 0 || style.marginBottom !== void 0 || style.marginLeft !== void 0 || style.marginHorizontal !== void 0 || style.marginVertical !== void 0) {
    const base = style.margin !== void 0 ? expandMarginEdges(style.margin) : { top: 0, right: 0, bottom: 0, left: 0 };
    const vt = style.marginVertical ?? base.top;
    const vb = style.marginVertical ?? base.bottom;
    const hl = style.marginHorizontal ?? base.left;
    const hr = style.marginHorizontal ?? base.right;
    result.margin = {
      top: style.marginTop ?? vt,
      right: style.marginRight ?? hr,
      bottom: style.marginBottom ?? vb,
      left: style.marginLeft ?? hl
    };
  }
  if (style.flex !== void 0) {
    if (style.flexGrow === void 0)
      result.flexGrow = style.flex;
    if (style.flexShrink === void 0)
      result.flexShrink = 1;
    if (style.flexBasis === void 0)
      result.flexBasis = { Pt: 0 };
  }
  if (style.flexDirection !== void 0)
    result.flexDirection = FLEX_DIRECTION_MAP[style.flexDirection];
  if (style.justifyContent !== void 0)
    result.justifyContent = JUSTIFY_CONTENT_MAP[style.justifyContent];
  if (style.alignItems !== void 0)
    result.alignItems = ALIGN_ITEMS_MAP[style.alignItems];
  if (style.alignSelf !== void 0)
    result.alignSelf = ALIGN_ITEMS_MAP[style.alignSelf];
  if (style.flexWrap !== void 0)
    result.flexWrap = FLEX_WRAP_MAP[style.flexWrap];
  if (style.alignContent !== void 0)
    result.alignContent = ALIGN_CONTENT_MAP[style.alignContent];
  if (style.flexGrow !== void 0)
    result.flexGrow = style.flexGrow;
  if (style.flexShrink !== void 0)
    result.flexShrink = style.flexShrink;
  if (style.flexBasis !== void 0)
    result.flexBasis = mapDimension(style.flexBasis);
  if (style.gap !== void 0)
    result.gap = style.gap;
  if (style.rowGap !== void 0)
    result.rowGap = style.rowGap;
  if (style.columnGap !== void 0)
    result.columnGap = style.columnGap;
  if (style.display !== void 0) {
    result.display = style.display === "grid" ? "Grid" : "Flex";
  }
  if (style.gridTemplateColumns !== void 0) {
    result.gridTemplateColumns = parseGridTemplate(style.gridTemplateColumns);
  }
  if (style.gridTemplateRows !== void 0) {
    result.gridTemplateRows = parseGridTemplate(style.gridTemplateRows);
  }
  if (style.gridAutoRows !== void 0) {
    result.gridAutoRows = mapGridTrack(style.gridAutoRows);
  }
  if (style.gridAutoColumns !== void 0) {
    result.gridAutoColumns = mapGridTrack(style.gridAutoColumns);
  }
  if (style.gridColumnStart !== void 0 || style.gridColumnEnd !== void 0 || style.gridRowStart !== void 0 || style.gridRowEnd !== void 0 || style.gridColumnSpan !== void 0 || style.gridRowSpan !== void 0) {
    const placement = {};
    if (style.gridColumnStart !== void 0)
      placement.columnStart = style.gridColumnStart;
    if (style.gridColumnEnd !== void 0)
      placement.columnEnd = style.gridColumnEnd;
    if (style.gridRowStart !== void 0)
      placement.rowStart = style.gridRowStart;
    if (style.gridRowEnd !== void 0)
      placement.rowEnd = style.gridRowEnd;
    if (style.gridColumnSpan !== void 0)
      placement.columnSpan = style.gridColumnSpan;
    if (style.gridRowSpan !== void 0)
      placement.rowSpan = style.gridRowSpan;
    result.gridPlacement = placement;
  }
  if (style.fontFamily !== void 0)
    result.fontFamily = style.fontFamily;
  if (style.fontSize !== void 0)
    result.fontSize = style.fontSize;
  if (style.fontWeight !== void 0) {
    result.fontWeight = style.fontWeight === "bold" ? 700 : style.fontWeight === "normal" ? 400 : style.fontWeight;
  }
  if (style.fontStyle !== void 0)
    result.fontStyle = FONT_STYLE_MAP[style.fontStyle];
  if (style.lineHeight !== void 0)
    result.lineHeight = style.lineHeight;
  if (style.textAlign !== void 0)
    result.textAlign = TEXT_ALIGN_MAP[style.textAlign];
  if (style.letterSpacing !== void 0)
    result.letterSpacing = style.letterSpacing;
  if (style.wordSpacing !== void 0)
    result.wordSpacing = style.wordSpacing;
  if (style.boxShadow !== void 0) {
    const parsed = parseBoxShadow(style.boxShadow);
    if (parsed)
      result.boxShadow = parsed;
  }
  if (style.transform !== void 0) {
    const parsed = parseTransform(style.transform);
    if (parsed && parsed.length > 0)
      result.transform = parsed;
  }
  if (style.transformOrigin !== void 0) {
    const parsed = parseTransformOrigin(style.transformOrigin);
    if (parsed)
      result.transformOrigin = parsed;
  }
  if (style.textDecoration !== void 0)
    result.textDecoration = TEXT_DECORATION_MAP[style.textDecoration];
  if (style.textTransform !== void 0)
    result.textTransform = TEXT_TRANSFORM_MAP[style.textTransform];
  if (style.hyphens !== void 0)
    result.hyphens = HYPHENS_MAP[style.hyphens];
  if (style.lang !== void 0)
    result.lang = style.lang;
  if (style.direction !== void 0)
    result.direction = style.direction;
  if (style.textOverflow !== void 0)
    result.textOverflow = TEXT_OVERFLOW_MAP[style.textOverflow];
  if (style.lineBreaking !== void 0)
    result.lineBreaking = LINE_BREAKING_MAP[style.lineBreaking];
  if (style.overflow !== void 0)
    result.overflow = OVERFLOW_MAP[style.overflow];
  if (style.color !== void 0)
    result.color = parseColor(style.color);
  if (style.backgroundColor !== void 0)
    result.backgroundColor = parseColor(style.backgroundColor);
  if (style.background !== void 0) {
    const parsed = parseBackground(style.background);
    if (parsed) {
      if (parsed.type === "color") {
        if (result.backgroundColor === void 0)
          result.backgroundColor = parsed.value;
      } else {
        result.background = parsed;
      }
    }
  }
  if (style.opacity !== void 0)
    result.opacity = style.opacity;
  let shortWidth = { top: void 0, right: void 0, bottom: void 0, left: void 0 };
  let shortColor = { top: void 0, right: void 0, bottom: void 0, left: void 0 };
  if (style.border !== void 0) {
    const parsed = parseBorderString(style.border);
    if (parsed.width !== void 0)
      shortWidth = { top: parsed.width, right: parsed.width, bottom: parsed.width, left: parsed.width };
    if (parsed.color !== void 0)
      shortColor = { top: parsed.color, right: parsed.color, bottom: parsed.color, left: parsed.color };
  }
  for (const [side, prop] of [["top", "borderTop"], ["right", "borderRight"], ["bottom", "borderBottom"], ["left", "borderLeft"]]) {
    const val = style[prop];
    if (val === void 0)
      continue;
    if (typeof val === "number") {
      shortWidth[side] = val;
    } else {
      const parsed = parseBorderString(val);
      if (parsed.width !== void 0)
        shortWidth[side] = parsed.width;
      if (parsed.color !== void 0)
        shortColor[side] = parsed.color;
    }
  }
  const hasBorderWidth = style.borderWidth !== void 0 || style.borderTopWidth !== void 0 || style.borderRightWidth !== void 0 || style.borderBottomWidth !== void 0 || style.borderLeftWidth !== void 0;
  const hasShortWidth = shortWidth.top !== void 0 || shortWidth.right !== void 0 || shortWidth.bottom !== void 0 || shortWidth.left !== void 0;
  if (hasBorderWidth || hasShortWidth) {
    const base = style.borderWidth !== void 0 ? expandEdgeValues(style.borderWidth) : { top: shortWidth.top ?? 0, right: shortWidth.right ?? 0, bottom: shortWidth.bottom ?? 0, left: shortWidth.left ?? 0 };
    result.borderWidth = {
      top: style.borderTopWidth ?? base.top,
      right: style.borderRightWidth ?? base.right,
      bottom: style.borderBottomWidth ?? base.bottom,
      left: style.borderLeftWidth ?? base.left
    };
  }
  const hasBorderColor = style.borderColor !== void 0 || style.borderTopColor !== void 0 || style.borderRightColor !== void 0 || style.borderBottomColor !== void 0 || style.borderLeftColor !== void 0;
  const hasShortColor = shortColor.top !== void 0 || shortColor.right !== void 0 || shortColor.bottom !== void 0 || shortColor.left !== void 0;
  if (hasBorderColor || hasShortColor) {
    const defaultColor = parseColor("#000000");
    let base = {
      top: shortColor.top ?? defaultColor,
      right: shortColor.right ?? defaultColor,
      bottom: shortColor.bottom ?? defaultColor,
      left: shortColor.left ?? defaultColor
    };
    if (typeof style.borderColor === "string") {
      const c = parseColor(style.borderColor);
      base = { top: c, right: c, bottom: c, left: c };
    } else if (style.borderColor && typeof style.borderColor === "object") {
      base = {
        top: parseColor(style.borderColor.top),
        right: parseColor(style.borderColor.right),
        bottom: parseColor(style.borderColor.bottom),
        left: parseColor(style.borderColor.left)
      };
    }
    result.borderColor = {
      top: style.borderTopColor ? parseColor(style.borderTopColor) : base.top,
      right: style.borderRightColor ? parseColor(style.borderRightColor) : base.right,
      bottom: style.borderBottomColor ? parseColor(style.borderBottomColor) : base.bottom,
      left: style.borderLeftColor ? parseColor(style.borderLeftColor) : base.left
    };
  }
  if (style.borderRadius !== void 0 || style.borderTopLeftRadius !== void 0 || style.borderTopRightRadius !== void 0 || style.borderBottomRightRadius !== void 0 || style.borderBottomLeftRadius !== void 0) {
    const base = style.borderRadius !== void 0 ? expandCorners(style.borderRadius) : { top_left: 0, top_right: 0, bottom_right: 0, bottom_left: 0 };
    result.borderRadius = {
      top_left: style.borderTopLeftRadius ?? base.top_left,
      top_right: style.borderTopRightRadius ?? base.top_right,
      bottom_right: style.borderBottomRightRadius ?? base.bottom_right,
      bottom_left: style.borderBottomLeftRadius ?? base.bottom_left
    };
  }
  if (style.position !== void 0) {
    result.position = style.position === "absolute" ? "Absolute" : "Relative";
  }
  if (style.top !== void 0)
    result.top = style.top;
  if (style.right !== void 0)
    result.right = style.right;
  if (style.bottom !== void 0)
    result.bottom = style.bottom;
  if (style.left !== void 0)
    result.left = style.left;
  if (style.wrap !== void 0)
    result.wrap = style.wrap;
  if (style.breakBefore !== void 0)
    result.breakBefore = style.breakBefore;
  if (style.minWidowLines !== void 0)
    result.minWidowLines = style.minWidowLines;
  if (style.minOrphanLines !== void 0)
    result.minOrphanLines = style.minOrphanLines;
  return result;
}
function mapGridTrack(track) {
  if (typeof track === "number")
    return { Pt: track };
  if (track === "auto")
    return "Auto";
  if (typeof track === "string") {
    const frMatch = track.match(/^([0-9.]+)fr$/);
    if (frMatch)
      return { Fr: parseFloat(frMatch[1]) };
    const num = parseFloat(track);
    if (!isNaN(num))
      return { Pt: num };
    return "Auto";
  }
  if (typeof track === "object" && "min" in track && "max" in track) {
    return { MinMax: [mapGridTrack(track.min), mapGridTrack(track.max)] };
  }
  return "Auto";
}
function expandRepeat(input) {
  return input.replace(/repeat\(\s*(\d+)\s*,\s*([^)]+)\)/g, (_match, count, tracks) => {
    return (tracks.trim() + " ").repeat(parseInt(count, 10)).trim();
  });
}
function parseGridTemplate(value) {
  if (Array.isArray(value)) {
    return value.map(mapGridTrack);
  }
  const expanded = expandRepeat(value);
  return expanded.split(/\s+/).filter(Boolean).map((token) => {
    if (token === "auto")
      return "Auto";
    const frMatch = token.match(/^([0-9.]+)fr$/);
    if (frMatch)
      return { Fr: parseFloat(frMatch[1]) };
    const num = parseFloat(token);
    if (!isNaN(num))
      return { Pt: num };
    return "Auto";
  });
}
function mapDimension(val) {
  if (typeof val === "number") {
    return { Pt: val };
  }
  if (val === "auto")
    return "Auto";
  const match = val.match(/^([0-9.]+)%$/);
  if (match) {
    return { Percent: parseFloat(match[1]) };
  }
  const num = parseFloat(val);
  if (!isNaN(num)) {
    return { Pt: num };
  }
  return "Auto";
}
function parseColor(hex) {
  const s = hex.trim();
  const rgbaMatch = s.match(/^rgba\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)$/);
  if (rgbaMatch) {
    return {
      r: parseFloat(rgbaMatch[1]) / 255,
      g: parseFloat(rgbaMatch[2]) / 255,
      b: parseFloat(rgbaMatch[3]) / 255,
      a: parseFloat(rgbaMatch[4])
    };
  }
  const rgbMatch = s.match(/^rgb\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)$/);
  if (rgbMatch) {
    return {
      r: parseFloat(rgbMatch[1]) / 255,
      g: parseFloat(rgbMatch[2]) / 255,
      b: parseFloat(rgbMatch[3]) / 255,
      a: 1
    };
  }
  const h = s.replace(/^#/, "");
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16) / 255;
    const g = parseInt(h[1] + h[1], 16) / 255;
    const b = parseInt(h[2] + h[2], 16) / 255;
    return { r, g, b, a: 1 };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return { r, g, b, a: 1 };
  }
  if (h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const a = parseInt(h.slice(6, 8), 16) / 255;
    return { r, g, b, a };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}
function parseTransform(val) {
  const ops = [];
  const re = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
  let m;
  let matched = false;
  while ((m = re.exec(val)) !== null) {
    matched = true;
    const name = m[1].toLowerCase();
    const args = m[2].split(/[,\s]+/).map((s) => s.trim()).filter((s) => s.length > 0);
    if (name === "rotate" || name === "rotatez") {
      if (args.length !== 1)
        return null;
      const deg = parseAngle(args[0]);
      if (deg === null)
        return null;
      ops.push({ type: "rotate", deg });
    } else if (name === "scale") {
      if (args.length === 0 || args.length > 2)
        return null;
      const x = parseFloat(args[0]);
      if (Number.isNaN(x))
        return null;
      const y = args.length === 2 ? parseFloat(args[1]) : x;
      if (Number.isNaN(y))
        return null;
      ops.push({ type: "scale", x, y });
    } else if (name === "scalex") {
      if (args.length !== 1)
        return null;
      const x = parseFloat(args[0]);
      if (Number.isNaN(x))
        return null;
      ops.push({ type: "scale", x, y: 1 });
    } else if (name === "scaley") {
      if (args.length !== 1)
        return null;
      const y = parseFloat(args[0]);
      if (Number.isNaN(y))
        return null;
      ops.push({ type: "scale", x: 1, y });
    } else if (name === "translate") {
      if (args.length === 0 || args.length > 2)
        return null;
      const x = parseLengthPt(args[0]);
      if (x === null)
        return null;
      const y = args.length === 2 ? parseLengthPt(args[1]) : 0;
      if (y === null)
        return null;
      ops.push({ type: "translate", x, y });
    } else if (name === "translatex") {
      if (args.length !== 1)
        return null;
      const x = parseLengthPt(args[0]);
      if (x === null)
        return null;
      ops.push({ type: "translate", x, y: 0 });
    } else if (name === "translatey") {
      if (args.length !== 1)
        return null;
      const y = parseLengthPt(args[0]);
      if (y === null)
        return null;
      ops.push({ type: "translate", x: 0, y });
    } else {
      return null;
    }
  }
  if (!matched)
    return null;
  return ops;
}
function parseAngle(s) {
  const t = s.trim().toLowerCase();
  let mult = 1;
  let body = t;
  if (t.endsWith("deg")) {
    body = t.slice(0, -3);
  } else if (t.endsWith("rad")) {
    body = t.slice(0, -3);
    mult = 180 / Math.PI;
  } else if (t.endsWith("turn")) {
    body = t.slice(0, -4);
    mult = 360;
  }
  const n = parseFloat(body);
  if (Number.isNaN(n))
    return null;
  return n * mult;
}
function parseLengthPt(s) {
  const t = s.trim().toLowerCase();
  const body = t.endsWith("px") || t.endsWith("pt") ? t.slice(0, -2) : t;
  const n = parseFloat(body);
  return Number.isNaN(n) ? null : n;
}
function parseTransformOrigin(val) {
  if (Array.isArray(val)) {
    const [x2, y2] = val;
    if (typeof x2 !== "number" || typeof y2 !== "number")
      return null;
    return [x2, y2];
  }
  const tokens = val.trim().split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0 || tokens.length > 2)
    return null;
  const x = parseOriginToken(tokens[0], "x");
  if (x === null)
    return null;
  const y = tokens.length === 2 ? parseOriginToken(tokens[1], "y") : 0.5;
  if (y === null)
    return null;
  return [x, y];
}
function parseOriginToken(token, axis) {
  const t = token.toLowerCase();
  if (t === "center")
    return 0.5;
  if (axis === "x") {
    if (t === "left")
      return 0;
    if (t === "right")
      return 1;
  } else {
    if (t === "top")
      return 0;
    if (t === "bottom")
      return 1;
  }
  if (t.endsWith("%")) {
    const n = parseFloat(t.slice(0, -1));
    return Number.isNaN(n) ? null : n / 100;
  }
  return null;
}
function parseBoxShadow(val) {
  if (typeof val === "object") {
    const c = parseColor(val.color);
    return {
      offsetX: val.offsetX,
      offsetY: val.offsetY,
      blur: val.blur ?? 0,
      color: c
    };
  }
  const tokens = [];
  let depth = 0;
  let buf = "";
  for (const ch of val.trim()) {
    if (ch === "(")
      depth += 1;
    if (ch === ")")
      depth = Math.max(0, depth - 1);
    if (/\s/.test(ch) && depth === 0) {
      if (buf) {
        tokens.push(buf);
        buf = "";
      }
    } else {
      buf += ch;
    }
  }
  if (buf)
    tokens.push(buf);
  if (tokens.length < 4)
    return null;
  const offsetX = parseFloat(tokens[0]);
  const offsetY = parseFloat(tokens[1]);
  const blur = parseFloat(tokens[2]);
  if (Number.isNaN(offsetX) || Number.isNaN(offsetY) || Number.isNaN(blur))
    return null;
  const color = parseColor(tokens[3]);
  return { offsetX, offsetY, blur, color };
}
function parseBackground(val) {
  const s = val.trim();
  const linearMatch = s.match(/^linear-gradient\s*\(\s*([\s\S]*)\s*\)$/i);
  if (linearMatch) {
    const inner = linearMatch[1];
    const parts = splitGradientArgs(inner);
    if (parts.length === 0)
      return null;
    let angleDeg = 180;
    let stopParts = parts;
    const first = parts[0].trim();
    const angleParsed = parseGradientAngle(first);
    if (angleParsed !== null) {
      angleDeg = angleParsed;
      stopParts = parts.slice(1);
    }
    const stops = parseGradientStops(stopParts);
    if (stops.length < 2)
      return null;
    return { type: "linear", angleDeg, stops };
  }
  const radialMatch = s.match(/^radial-gradient\s*\(\s*([\s\S]*)\s*\)$/i);
  if (radialMatch) {
    const inner = radialMatch[1];
    const parts = splitGradientArgs(inner);
    if (parts.length === 0)
      return null;
    let stopParts = parts;
    const first = parts[0].trim().toLowerCase();
    if (first === "circle" || first === "ellipse" || first.startsWith("circle ") || first.startsWith("ellipse ")) {
      stopParts = parts.slice(1);
    }
    const stops = parseGradientStops(stopParts);
    if (stops.length < 2)
      return null;
    return { type: "radial", stops };
  }
  if (/^(#|rgb\(|rgba\()/i.test(s)) {
    return { type: "color", value: parseColor(s) };
  }
  return null;
}
function splitGradientArgs(inner) {
  const parts = [];
  let depth = 0;
  let buf = "";
  for (const ch of inner) {
    if (ch === "(")
      depth += 1;
    else if (ch === ")")
      depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim())
    parts.push(buf);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}
function parseGradientAngle(token) {
  const t = token.trim().toLowerCase();
  const degMatch = t.match(/^(-?\d+(?:\.\d+)?)deg$/);
  if (degMatch)
    return parseFloat(degMatch[1]);
  const turnMatch = t.match(/^(-?\d+(?:\.\d+)?)turn$/);
  if (turnMatch)
    return parseFloat(turnMatch[1]) * 360;
  const radMatch = t.match(/^(-?\d+(?:\.\d+)?)rad$/);
  if (radMatch)
    return parseFloat(radMatch[1]) * 180 / Math.PI;
  const gradMatch = t.match(/^(-?\d+(?:\.\d+)?)grad$/);
  if (gradMatch)
    return parseFloat(gradMatch[1]) * 0.9;
  if (t === "to top")
    return 0;
  if (t === "to right")
    return 90;
  if (t === "to bottom")
    return 180;
  if (t === "to left")
    return 270;
  if (t === "to top right" || t === "to right top")
    return 45;
  if (t === "to bottom right" || t === "to right bottom")
    return 135;
  if (t === "to bottom left" || t === "to left bottom")
    return 225;
  if (t === "to top left" || t === "to left top")
    return 315;
  return null;
}
function parseGradientStops(parts) {
  if (parts.length === 0)
    return [];
  const positions = [];
  const colors = [];
  for (const p of parts) {
    const trimmed = p.trim();
    const tokens = splitColorAndPosition(trimmed);
    if (!tokens)
      continue;
    colors.push(parseColor(tokens.color));
    positions.push(tokens.position);
  }
  if (colors.length === 0)
    return [];
  if (positions[0] === null)
    positions[0] = 0;
  if (positions[positions.length - 1] === null)
    positions[positions.length - 1] = 1;
  for (let i = 1; i < positions.length - 1; i += 1) {
    if (positions[i] === null) {
      let prev = i - 1;
      while (prev >= 0 && positions[prev] === null)
        prev -= 1;
      let next = i + 1;
      while (next < positions.length && positions[next] === null)
        next += 1;
      const p0 = positions[prev] ?? 0;
      const p1 = positions[next] ?? 1;
      positions[i] = p0 + (p1 - p0) * (i - prev) / (next - prev);
    }
  }
  return colors.map((color, i) => ({
    position: Math.max(0, Math.min(1, positions[i])),
    color
  }));
}
function splitColorAndPosition(s) {
  const tokens = [];
  let depth = 0;
  let buf = "";
  for (const ch of s) {
    if (ch === "(")
      depth += 1;
    else if (ch === ")")
      depth = Math.max(0, depth - 1);
    if (/\s/.test(ch) && depth === 0) {
      if (buf) {
        tokens.push(buf);
        buf = "";
      }
    } else {
      buf += ch;
    }
  }
  if (buf)
    tokens.push(buf);
  if (tokens.length === 0)
    return null;
  const last = tokens[tokens.length - 1];
  const pctMatch = last.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (pctMatch) {
    return { color: tokens.slice(0, -1).join(" "), position: parseFloat(pctMatch[1]) / 100 };
  }
  const fracMatch = last.match(/^(-?\d+(?:\.\d+)?)$/);
  if (fracMatch && tokens.length > 1) {
    return { color: tokens.slice(0, -1).join(" "), position: parseFloat(fracMatch[1]) };
  }
  return { color: tokens.join(" "), position: null };
}
function parseCSSEdges(val) {
  const values = Array.isArray(val) ? val : val.trim().split(/\s+/).map((s) => parseFloat(s.replace(/px$/i, "")));
  switch (values.length) {
    case 1:
      return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
    case 2:
      return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
    case 3:
      return { top: values[0], right: values[1], bottom: values[2], left: values[1] };
    default:
      return { top: values[0], right: values[1], bottom: values[2], left: values[3] };
  }
}
function parseBorderString(val) {
  const tokens = val.trim().split(/\s+/);
  let width;
  let color;
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (BORDER_STYLE_KEYWORDS.has(lower))
      continue;
    const num = parseFloat(lower.replace(/px$/i, ""));
    if (!isNaN(num) && /^[\d.]/.test(lower)) {
      width = num;
    } else {
      color = parseColor(token);
    }
  }
  return { width, color };
}
function expandEdges(val) {
  if (typeof val === "number") {
    return { top: val, right: val, bottom: val, left: val };
  }
  if (typeof val === "string" || Array.isArray(val)) {
    return parseCSSEdges(val);
  }
  return { top: val.top, right: val.right, bottom: val.bottom, left: val.left };
}
function expandMarginEdges(val) {
  if (typeof val === "number") {
    return { top: val, right: val, bottom: val, left: val };
  }
  if (typeof val === "string") {
    if (val === "auto") {
      return { top: "auto", right: "auto", bottom: "auto", left: "auto" };
    }
    const edges = parseCSSEdges(val);
    return edges;
  }
  if (Array.isArray(val)) {
    return parseCSSEdges(val);
  }
  return { top: val.top, right: val.right, bottom: val.bottom, left: val.left };
}
function expandEdgeValues(val) {
  if (typeof val === "number") {
    return { top: val, right: val, bottom: val, left: val };
  }
  return { top: val.top, right: val.right, bottom: val.bottom, left: val.left };
}
function expandCorners(val) {
  if (typeof val === "number") {
    return { top_left: val, top_right: val, bottom_right: val, bottom_left: val };
  }
  return {
    top_left: val.topLeft,
    top_right: val.topRight,
    bottom_right: val.bottomRight,
    bottom_left: val.bottomLeft
  };
}
function mapColumnWidth(w) {
  if (w === "auto")
    return "Auto";
  if ("fraction" in w)
    return { Fraction: w.fraction };
  if ("fixed" in w)
    return { Fixed: w.fixed };
  return "Auto";
}
var FLEX_DIRECTION_MAP, JUSTIFY_CONTENT_MAP, ALIGN_ITEMS_MAP, FLEX_WRAP_MAP, ALIGN_CONTENT_MAP, FONT_STYLE_MAP, TEXT_ALIGN_MAP, TEXT_DECORATION_MAP, TEXT_TRANSFORM_MAP, HYPHENS_MAP, TEXT_OVERFLOW_MAP, LINE_BREAKING_MAP, OVERFLOW_MAP, BORDER_STYLE_KEYWORDS;
var init_style = __esm({
  "node_modules/@formepdf/shared/dist/style.js"() {
    "use strict";
    FLEX_DIRECTION_MAP = {
      "row": "Row",
      "column": "Column",
      "row-reverse": "RowReverse",
      "column-reverse": "ColumnReverse"
    };
    JUSTIFY_CONTENT_MAP = {
      "flex-start": "FlexStart",
      "flex-end": "FlexEnd",
      "center": "Center",
      "space-between": "SpaceBetween",
      "space-around": "SpaceAround",
      "space-evenly": "SpaceEvenly"
    };
    ALIGN_ITEMS_MAP = {
      "flex-start": "FlexStart",
      "flex-end": "FlexEnd",
      "center": "Center",
      "stretch": "Stretch",
      "baseline": "Baseline"
    };
    FLEX_WRAP_MAP = {
      "nowrap": "NoWrap",
      "wrap": "Wrap",
      "wrap-reverse": "WrapReverse"
    };
    ALIGN_CONTENT_MAP = {
      "flex-start": "FlexStart",
      "flex-end": "FlexEnd",
      "center": "Center",
      "space-between": "SpaceBetween",
      "space-around": "SpaceAround",
      "space-evenly": "SpaceEvenly",
      "stretch": "Stretch"
    };
    FONT_STYLE_MAP = {
      "normal": "Normal",
      "italic": "Italic",
      "oblique": "Oblique"
    };
    TEXT_ALIGN_MAP = {
      "left": "Left",
      "right": "Right",
      "center": "Center",
      "justify": "Justify"
    };
    TEXT_DECORATION_MAP = {
      "none": "None",
      "underline": "Underline",
      "line-through": "LineThrough"
    };
    TEXT_TRANSFORM_MAP = {
      "none": "None",
      "uppercase": "Uppercase",
      "lowercase": "Lowercase",
      "capitalize": "Capitalize"
    };
    HYPHENS_MAP = {
      "none": "none",
      "manual": "manual",
      "auto": "auto"
    };
    TEXT_OVERFLOW_MAP = {
      "wrap": "Wrap",
      "ellipsis": "Ellipsis",
      "clip": "Clip"
    };
    LINE_BREAKING_MAP = {
      "optimal": "optimal",
      "greedy": "greedy"
    };
    OVERFLOW_MAP = {
      "visible": "Visible",
      "hidden": "Hidden"
    };
    BORDER_STYLE_KEYWORDS = /* @__PURE__ */ new Set([
      "solid",
      "dashed",
      "dotted",
      "double",
      "groove",
      "ridge",
      "inset",
      "outset",
      "none",
      "hidden"
    ]);
  }
});

// node_modules/@formepdf/shared/dist/font.js
function normalizeWeight(w) {
  if (w === void 0 || w === "normal")
    return 400;
  if (w === "bold")
    return 700;
  return typeof w === "number" ? w : parseInt(w, 10) || 400;
}
function normalizeFontWeight(w) {
  if (w === void 0 || w === "normal")
    return 400;
  if (w === "bold")
    return 700;
  return typeof w === "number" ? w : parseInt(w, 10) || 400;
}
function fontKey(family, weight, italic) {
  return `${family}:${weight}:${italic}`;
}
function mergeFonts(globalFonts2, docFonts) {
  const map = /* @__PURE__ */ new Map();
  for (const f of globalFonts2) {
    const weight = normalizeFontWeight(f.fontWeight);
    const italic = f.fontStyle === "italic" || f.fontStyle === "oblique";
    const key = fontKey(f.family, weight, italic);
    map.set(key, { family: f.family, src: f.src, weight, italic });
  }
  if (docFonts) {
    for (const f of docFonts) {
      const weight = normalizeFontWeight(f.fontWeight);
      const italic = f.fontStyle === "italic" || f.fontStyle === "oblique";
      const key = fontKey(f.family, weight, italic);
      map.set(key, { family: f.family, src: f.src, weight, italic });
    }
  }
  return Array.from(map.values());
}
var globalFonts, Font;
var init_font = __esm({
  "node_modules/@formepdf/shared/dist/font.js"() {
    "use strict";
    globalFonts = [];
    Font = {
      register(options) {
        globalFonts.push({
          ...options,
          fontWeight: normalizeWeight(options.fontWeight),
          fontStyle: options.fontStyle || "normal"
        });
      },
      clear() {
        globalFonts.length = 0;
      },
      getRegistered() {
        return [...globalFonts];
      }
    };
  }
});

// node_modules/@formepdf/shared/dist/canvas.js
function recordCanvasOperations(draw) {
  const operations = [];
  const ctx = {
    moveTo(x, y) {
      operations.push({ op: "MoveTo", x, y });
    },
    lineTo(x, y) {
      operations.push({ op: "LineTo", x, y });
    },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
      operations.push({ op: "BezierCurveTo", cp1x, cp1y, cp2x, cp2y, x, y });
    },
    quadraticCurveTo(cpx, cpy, x, y) {
      operations.push({ op: "QuadraticCurveTo", cpx, cpy, x, y });
    },
    closePath() {
      operations.push({ op: "ClosePath" });
    },
    rect(x, y, w, h) {
      operations.push({ op: "Rect", x, y, width: w, height: h });
    },
    circle(cx, cy, r) {
      operations.push({ op: "Circle", cx, cy, r });
    },
    ellipse(cx, cy, rx, ry) {
      operations.push({ op: "Ellipse", cx, cy, rx, ry });
    },
    arc(cx, cy, r, startAngle, endAngle, counterclockwise = false) {
      operations.push({ op: "Arc", cx, cy, r, start_angle: startAngle, end_angle: endAngle, counterclockwise });
    },
    line(x1, y1, x2, y2) {
      operations.push({ op: "MoveTo", x: x1, y: y1 });
      operations.push({ op: "LineTo", x: x2, y: y2 });
      operations.push({ op: "Stroke" });
    },
    stroke() {
      operations.push({ op: "Stroke" });
    },
    fill() {
      operations.push({ op: "Fill" });
    },
    fillAndStroke() {
      operations.push({ op: "FillAndStroke" });
    },
    setFillColor(r, g, b) {
      operations.push({ op: "SetFillColor", r, g, b });
    },
    setStrokeColor(r, g, b) {
      operations.push({ op: "SetStrokeColor", r, g, b });
    },
    setLineWidth(w) {
      operations.push({ op: "SetLineWidth", width: w });
    },
    setLineCap(cap) {
      operations.push({ op: "SetLineCap", cap });
    },
    setLineJoin(join3) {
      operations.push({ op: "SetLineJoin", join: join3 });
    },
    save() {
      operations.push({ op: "Save" });
    },
    restore() {
      operations.push({ op: "Restore" });
    }
  };
  draw(ctx);
  return operations;
}
var init_canvas = __esm({
  "node_modules/@formepdf/shared/dist/canvas.js"() {
    "use strict";
  }
});

// node_modules/@formepdf/shared/dist/semantics.js
function mapListMarker(marker, defaultValue) {
  switch (marker) {
    case "disc":
      return "disc";
    case "circle":
      return "circle";
    case "square":
      return "square";
    case "none":
      return "none";
    case "decimal":
      return "decimal";
    case "lower-alpha":
      return "lowerAlpha";
    case "upper-alpha":
      return "upperAlpha";
    case "lower-roman":
      return "lowerRoman";
    case "upper-roman":
      return "upperRoman";
    default:
      return defaultValue;
  }
}
var STRONG_DEFAULTS, EM_DEFAULTS, CODE_DEFAULTS, LINK_DEFAULTS, HEADING_DEFAULTS;
var init_semantics = __esm({
  "node_modules/@formepdf/shared/dist/semantics.js"() {
    "use strict";
    STRONG_DEFAULTS = { fontWeight: 700 };
    EM_DEFAULTS = { fontStyle: "italic" };
    CODE_DEFAULTS = {
      fontFamily: "Courier",
      backgroundColor: "#F4F4F5"
    };
    LINK_DEFAULTS = {
      color: "#2563EB",
      textDecoration: "underline"
    };
    HEADING_DEFAULTS = {
      1: { fontSize: 32, fontWeight: 700, marginTop: 24, marginBottom: 16 },
      2: { fontSize: 24, fontWeight: 700, marginTop: 20, marginBottom: 14 },
      3: { fontSize: 20, fontWeight: 600, marginTop: 16, marginBottom: 12 },
      4: { fontSize: 18, fontWeight: 600, marginTop: 14, marginBottom: 10 },
      5: { fontSize: 16, fontWeight: 600, marginTop: 12, marginBottom: 8 },
      6: { fontSize: 14, fontWeight: 600, marginTop: 10, marginBottom: 6 }
    };
  }
});

// node_modules/@formepdf/shared/dist/charts.js
function mapDataPoints(data) {
  return data.map((d) => ({ label: d.label, value: d.value, color: d.color }));
}
function buildBarChartKind(props) {
  const kind = {
    type: "BarChart",
    data: mapDataPoints(props.data),
    width: props.width,
    height: props.height,
    show_labels: props.showLabels ?? true,
    show_values: props.showValues ?? false,
    show_grid: props.showGrid ?? false
  };
  if (props.color !== void 0)
    kind.color = props.color;
  if (props.title !== void 0)
    kind.title = props.title;
  return kind;
}
function buildLineChartKind(props) {
  const kind = {
    type: "LineChart",
    series: props.series.map((s) => ({ name: s.name, data: s.data, color: s.color })),
    labels: props.labels,
    width: props.width,
    height: props.height,
    show_points: props.showPoints ?? false,
    show_grid: props.showGrid ?? false
  };
  if (props.title !== void 0)
    kind.title = props.title;
  return kind;
}
function buildPieChartKind(props) {
  const kind = {
    type: "PieChart",
    data: mapDataPoints(props.data),
    width: props.width,
    height: props.height,
    donut: props.donut ?? false,
    show_legend: props.showLegend ?? false
  };
  if (props.title !== void 0)
    kind.title = props.title;
  return kind;
}
function buildAreaChartKind(props) {
  const kind = {
    type: "AreaChart",
    series: props.series.map((s) => ({ name: s.name, data: s.data, color: s.color })),
    labels: props.labels,
    width: props.width,
    height: props.height,
    show_grid: props.showGrid ?? false
  };
  if (props.title !== void 0)
    kind.title = props.title;
  return kind;
}
function buildDotPlotKind(props) {
  const kind = {
    type: "DotPlot",
    groups: props.groups.map((g) => ({ name: g.name, color: g.color, data: g.data })),
    width: props.width,
    height: props.height,
    show_legend: props.showLegend ?? false,
    dot_size: props.dotSize ?? 4
  };
  if (props.xMin !== void 0)
    kind.x_min = props.xMin;
  if (props.xMax !== void 0)
    kind.x_max = props.xMax;
  if (props.yMin !== void 0)
    kind.y_min = props.yMin;
  if (props.yMax !== void 0)
    kind.y_max = props.yMax;
  if (props.xLabel !== void 0)
    kind.x_label = props.xLabel;
  if (props.yLabel !== void 0)
    kind.y_label = props.yLabel;
  return kind;
}
var init_charts2 = __esm({
  "node_modules/@formepdf/shared/dist/charts.js"() {
    "use strict";
  }
});

// node_modules/parse5/dist/common/unicode.js
var CODE_POINTS;
var init_unicode = __esm({
  "node_modules/parse5/dist/common/unicode.js"() {
    "use strict";
    (function(CODE_POINTS2) {
      CODE_POINTS2[CODE_POINTS2["EOF"] = -1] = "EOF";
      CODE_POINTS2[CODE_POINTS2["NULL"] = 0] = "NULL";
      CODE_POINTS2[CODE_POINTS2["TABULATION"] = 9] = "TABULATION";
      CODE_POINTS2[CODE_POINTS2["CARRIAGE_RETURN"] = 13] = "CARRIAGE_RETURN";
      CODE_POINTS2[CODE_POINTS2["LINE_FEED"] = 10] = "LINE_FEED";
      CODE_POINTS2[CODE_POINTS2["FORM_FEED"] = 12] = "FORM_FEED";
      CODE_POINTS2[CODE_POINTS2["SPACE"] = 32] = "SPACE";
      CODE_POINTS2[CODE_POINTS2["EXCLAMATION_MARK"] = 33] = "EXCLAMATION_MARK";
      CODE_POINTS2[CODE_POINTS2["QUOTATION_MARK"] = 34] = "QUOTATION_MARK";
      CODE_POINTS2[CODE_POINTS2["AMPERSAND"] = 38] = "AMPERSAND";
      CODE_POINTS2[CODE_POINTS2["APOSTROPHE"] = 39] = "APOSTROPHE";
      CODE_POINTS2[CODE_POINTS2["HYPHEN_MINUS"] = 45] = "HYPHEN_MINUS";
      CODE_POINTS2[CODE_POINTS2["SOLIDUS"] = 47] = "SOLIDUS";
      CODE_POINTS2[CODE_POINTS2["DIGIT_0"] = 48] = "DIGIT_0";
      CODE_POINTS2[CODE_POINTS2["DIGIT_9"] = 57] = "DIGIT_9";
      CODE_POINTS2[CODE_POINTS2["SEMICOLON"] = 59] = "SEMICOLON";
      CODE_POINTS2[CODE_POINTS2["LESS_THAN_SIGN"] = 60] = "LESS_THAN_SIGN";
      CODE_POINTS2[CODE_POINTS2["EQUALS_SIGN"] = 61] = "EQUALS_SIGN";
      CODE_POINTS2[CODE_POINTS2["GREATER_THAN_SIGN"] = 62] = "GREATER_THAN_SIGN";
      CODE_POINTS2[CODE_POINTS2["QUESTION_MARK"] = 63] = "QUESTION_MARK";
      CODE_POINTS2[CODE_POINTS2["LATIN_CAPITAL_A"] = 65] = "LATIN_CAPITAL_A";
      CODE_POINTS2[CODE_POINTS2["LATIN_CAPITAL_Z"] = 90] = "LATIN_CAPITAL_Z";
      CODE_POINTS2[CODE_POINTS2["RIGHT_SQUARE_BRACKET"] = 93] = "RIGHT_SQUARE_BRACKET";
      CODE_POINTS2[CODE_POINTS2["GRAVE_ACCENT"] = 96] = "GRAVE_ACCENT";
      CODE_POINTS2[CODE_POINTS2["LATIN_SMALL_A"] = 97] = "LATIN_SMALL_A";
      CODE_POINTS2[CODE_POINTS2["LATIN_SMALL_Z"] = 122] = "LATIN_SMALL_Z";
    })(CODE_POINTS || (CODE_POINTS = {}));
  }
});

// node_modules/parse5/dist/common/error-codes.js
var ERR;
var init_error_codes = __esm({
  "node_modules/parse5/dist/common/error-codes.js"() {
    "use strict";
    (function(ERR2) {
      ERR2["controlCharacterInInputStream"] = "control-character-in-input-stream";
      ERR2["noncharacterInInputStream"] = "noncharacter-in-input-stream";
      ERR2["surrogateInInputStream"] = "surrogate-in-input-stream";
      ERR2["nonVoidHtmlElementStartTagWithTrailingSolidus"] = "non-void-html-element-start-tag-with-trailing-solidus";
      ERR2["endTagWithAttributes"] = "end-tag-with-attributes";
      ERR2["endTagWithTrailingSolidus"] = "end-tag-with-trailing-solidus";
      ERR2["unexpectedSolidusInTag"] = "unexpected-solidus-in-tag";
      ERR2["unexpectedNullCharacter"] = "unexpected-null-character";
      ERR2["unexpectedQuestionMarkInsteadOfTagName"] = "unexpected-question-mark-instead-of-tag-name";
      ERR2["invalidFirstCharacterOfTagName"] = "invalid-first-character-of-tag-name";
      ERR2["unexpectedEqualsSignBeforeAttributeName"] = "unexpected-equals-sign-before-attribute-name";
      ERR2["missingEndTagName"] = "missing-end-tag-name";
      ERR2["unexpectedCharacterInAttributeName"] = "unexpected-character-in-attribute-name";
      ERR2["unknownNamedCharacterReference"] = "unknown-named-character-reference";
      ERR2["missingSemicolonAfterCharacterReference"] = "missing-semicolon-after-character-reference";
      ERR2["unexpectedCharacterAfterDoctypeSystemIdentifier"] = "unexpected-character-after-doctype-system-identifier";
      ERR2["unexpectedCharacterInUnquotedAttributeValue"] = "unexpected-character-in-unquoted-attribute-value";
      ERR2["eofBeforeTagName"] = "eof-before-tag-name";
      ERR2["eofInTag"] = "eof-in-tag";
      ERR2["missingAttributeValue"] = "missing-attribute-value";
      ERR2["missingWhitespaceBetweenAttributes"] = "missing-whitespace-between-attributes";
      ERR2["missingWhitespaceAfterDoctypePublicKeyword"] = "missing-whitespace-after-doctype-public-keyword";
      ERR2["missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers"] = "missing-whitespace-between-doctype-public-and-system-identifiers";
      ERR2["missingWhitespaceAfterDoctypeSystemKeyword"] = "missing-whitespace-after-doctype-system-keyword";
      ERR2["missingQuoteBeforeDoctypePublicIdentifier"] = "missing-quote-before-doctype-public-identifier";
      ERR2["missingQuoteBeforeDoctypeSystemIdentifier"] = "missing-quote-before-doctype-system-identifier";
      ERR2["missingDoctypePublicIdentifier"] = "missing-doctype-public-identifier";
      ERR2["missingDoctypeSystemIdentifier"] = "missing-doctype-system-identifier";
      ERR2["abruptDoctypePublicIdentifier"] = "abrupt-doctype-public-identifier";
      ERR2["abruptDoctypeSystemIdentifier"] = "abrupt-doctype-system-identifier";
      ERR2["cdataInHtmlContent"] = "cdata-in-html-content";
      ERR2["incorrectlyOpenedComment"] = "incorrectly-opened-comment";
      ERR2["eofInScriptHtmlCommentLikeText"] = "eof-in-script-html-comment-like-text";
      ERR2["eofInDoctype"] = "eof-in-doctype";
      ERR2["nestedComment"] = "nested-comment";
      ERR2["abruptClosingOfEmptyComment"] = "abrupt-closing-of-empty-comment";
      ERR2["eofInComment"] = "eof-in-comment";
      ERR2["incorrectlyClosedComment"] = "incorrectly-closed-comment";
      ERR2["eofInCdata"] = "eof-in-cdata";
      ERR2["absenceOfDigitsInNumericCharacterReference"] = "absence-of-digits-in-numeric-character-reference";
      ERR2["nullCharacterReference"] = "null-character-reference";
      ERR2["surrogateCharacterReference"] = "surrogate-character-reference";
      ERR2["characterReferenceOutsideUnicodeRange"] = "character-reference-outside-unicode-range";
      ERR2["controlCharacterReference"] = "control-character-reference";
      ERR2["noncharacterCharacterReference"] = "noncharacter-character-reference";
      ERR2["missingWhitespaceBeforeDoctypeName"] = "missing-whitespace-before-doctype-name";
      ERR2["missingDoctypeName"] = "missing-doctype-name";
      ERR2["invalidCharacterSequenceAfterDoctypeName"] = "invalid-character-sequence-after-doctype-name";
      ERR2["duplicateAttribute"] = "duplicate-attribute";
      ERR2["nonConformingDoctype"] = "non-conforming-doctype";
      ERR2["missingDoctype"] = "missing-doctype";
      ERR2["misplacedDoctype"] = "misplaced-doctype";
      ERR2["endTagWithoutMatchingOpenElement"] = "end-tag-without-matching-open-element";
      ERR2["closingOfElementWithOpenChildElements"] = "closing-of-element-with-open-child-elements";
      ERR2["disallowedContentInNoscriptInHead"] = "disallowed-content-in-noscript-in-head";
      ERR2["openElementsLeftAfterEof"] = "open-elements-left-after-eof";
      ERR2["abandonedHeadElementChild"] = "abandoned-head-element-child";
      ERR2["misplacedStartTagForHeadElement"] = "misplaced-start-tag-for-head-element";
      ERR2["nestedNoscriptInHead"] = "nested-noscript-in-head";
      ERR2["eofInElementThatCanContainOnlyText"] = "eof-in-element-that-can-contain-only-text";
    })(ERR || (ERR = {}));
  }
});

// node_modules/parse5/dist/tokenizer/preprocessor.js
var DEFAULT_BUFFER_WATERLINE;
var init_preprocessor = __esm({
  "node_modules/parse5/dist/tokenizer/preprocessor.js"() {
    "use strict";
    init_unicode();
    init_error_codes();
    DEFAULT_BUFFER_WATERLINE = 1 << 16;
  }
});

// node_modules/parse5/dist/common/token.js
var TokenType;
var init_token = __esm({
  "node_modules/parse5/dist/common/token.js"() {
    "use strict";
    (function(TokenType2) {
      TokenType2[TokenType2["CHARACTER"] = 0] = "CHARACTER";
      TokenType2[TokenType2["NULL_CHARACTER"] = 1] = "NULL_CHARACTER";
      TokenType2[TokenType2["WHITESPACE_CHARACTER"] = 2] = "WHITESPACE_CHARACTER";
      TokenType2[TokenType2["START_TAG"] = 3] = "START_TAG";
      TokenType2[TokenType2["END_TAG"] = 4] = "END_TAG";
      TokenType2[TokenType2["COMMENT"] = 5] = "COMMENT";
      TokenType2[TokenType2["DOCTYPE"] = 6] = "DOCTYPE";
      TokenType2[TokenType2["EOF"] = 7] = "EOF";
      TokenType2[TokenType2["HIBERNATION"] = 8] = "HIBERNATION";
    })(TokenType || (TokenType = {}));
  }
});

// node_modules/entities/dist/esm/generated/decode-data-html.js
var init_decode_data_html = __esm({
  "node_modules/entities/dist/esm/generated/decode-data-html.js"() {
    "use strict";
  }
});

// node_modules/entities/dist/esm/generated/decode-data-xml.js
var init_decode_data_xml = __esm({
  "node_modules/entities/dist/esm/generated/decode-data-xml.js"() {
    "use strict";
  }
});

// node_modules/entities/dist/esm/decode-codepoint.js
var _a, fromCodePoint;
var init_decode_codepoint = __esm({
  "node_modules/entities/dist/esm/decode-codepoint.js"() {
    "use strict";
    fromCodePoint = // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, n/no-unsupported-features/es-builtins
    (_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function(codePoint) {
      let output = "";
      if (codePoint > 65535) {
        codePoint -= 65536;
        output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
        codePoint = 56320 | codePoint & 1023;
      }
      output += String.fromCharCode(codePoint);
      return output;
    };
  }
});

// node_modules/entities/dist/esm/decode.js
var CharCodes, BinTrieFlags, EntityDecoderState, DecodingMode;
var init_decode = __esm({
  "node_modules/entities/dist/esm/decode.js"() {
    "use strict";
    init_decode_data_html();
    init_decode_data_xml();
    init_decode_codepoint();
    init_decode_data_html();
    init_decode_data_xml();
    init_decode_codepoint();
    (function(CharCodes2) {
      CharCodes2[CharCodes2["NUM"] = 35] = "NUM";
      CharCodes2[CharCodes2["SEMI"] = 59] = "SEMI";
      CharCodes2[CharCodes2["EQUALS"] = 61] = "EQUALS";
      CharCodes2[CharCodes2["ZERO"] = 48] = "ZERO";
      CharCodes2[CharCodes2["NINE"] = 57] = "NINE";
      CharCodes2[CharCodes2["LOWER_A"] = 97] = "LOWER_A";
      CharCodes2[CharCodes2["LOWER_F"] = 102] = "LOWER_F";
      CharCodes2[CharCodes2["LOWER_X"] = 120] = "LOWER_X";
      CharCodes2[CharCodes2["LOWER_Z"] = 122] = "LOWER_Z";
      CharCodes2[CharCodes2["UPPER_A"] = 65] = "UPPER_A";
      CharCodes2[CharCodes2["UPPER_F"] = 70] = "UPPER_F";
      CharCodes2[CharCodes2["UPPER_Z"] = 90] = "UPPER_Z";
    })(CharCodes || (CharCodes = {}));
    (function(BinTrieFlags2) {
      BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
      BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
      BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
    })(BinTrieFlags || (BinTrieFlags = {}));
    (function(EntityDecoderState2) {
      EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
      EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
      EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
      EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
      EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
    })(EntityDecoderState || (EntityDecoderState = {}));
    (function(DecodingMode2) {
      DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
      DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
      DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
    })(DecodingMode || (DecodingMode = {}));
  }
});

// node_modules/parse5/dist/common/html.js
var NS, ATTRS, DOCUMENT_MODE, TAG_NAMES, TAG_ID, TAG_NAME_TO_ID, $, SPECIAL_ELEMENTS, NUMBERED_HEADERS, UNESCAPED_TEXT;
var init_html = __esm({
  "node_modules/parse5/dist/common/html.js"() {
    "use strict";
    (function(NS2) {
      NS2["HTML"] = "http://www.w3.org/1999/xhtml";
      NS2["MATHML"] = "http://www.w3.org/1998/Math/MathML";
      NS2["SVG"] = "http://www.w3.org/2000/svg";
      NS2["XLINK"] = "http://www.w3.org/1999/xlink";
      NS2["XML"] = "http://www.w3.org/XML/1998/namespace";
      NS2["XMLNS"] = "http://www.w3.org/2000/xmlns/";
    })(NS || (NS = {}));
    (function(ATTRS2) {
      ATTRS2["TYPE"] = "type";
      ATTRS2["ACTION"] = "action";
      ATTRS2["ENCODING"] = "encoding";
      ATTRS2["PROMPT"] = "prompt";
      ATTRS2["NAME"] = "name";
      ATTRS2["COLOR"] = "color";
      ATTRS2["FACE"] = "face";
      ATTRS2["SIZE"] = "size";
    })(ATTRS || (ATTRS = {}));
    (function(DOCUMENT_MODE2) {
      DOCUMENT_MODE2["NO_QUIRKS"] = "no-quirks";
      DOCUMENT_MODE2["QUIRKS"] = "quirks";
      DOCUMENT_MODE2["LIMITED_QUIRKS"] = "limited-quirks";
    })(DOCUMENT_MODE || (DOCUMENT_MODE = {}));
    (function(TAG_NAMES2) {
      TAG_NAMES2["A"] = "a";
      TAG_NAMES2["ADDRESS"] = "address";
      TAG_NAMES2["ANNOTATION_XML"] = "annotation-xml";
      TAG_NAMES2["APPLET"] = "applet";
      TAG_NAMES2["AREA"] = "area";
      TAG_NAMES2["ARTICLE"] = "article";
      TAG_NAMES2["ASIDE"] = "aside";
      TAG_NAMES2["B"] = "b";
      TAG_NAMES2["BASE"] = "base";
      TAG_NAMES2["BASEFONT"] = "basefont";
      TAG_NAMES2["BGSOUND"] = "bgsound";
      TAG_NAMES2["BIG"] = "big";
      TAG_NAMES2["BLOCKQUOTE"] = "blockquote";
      TAG_NAMES2["BODY"] = "body";
      TAG_NAMES2["BR"] = "br";
      TAG_NAMES2["BUTTON"] = "button";
      TAG_NAMES2["CAPTION"] = "caption";
      TAG_NAMES2["CENTER"] = "center";
      TAG_NAMES2["CODE"] = "code";
      TAG_NAMES2["COL"] = "col";
      TAG_NAMES2["COLGROUP"] = "colgroup";
      TAG_NAMES2["DD"] = "dd";
      TAG_NAMES2["DESC"] = "desc";
      TAG_NAMES2["DETAILS"] = "details";
      TAG_NAMES2["DIALOG"] = "dialog";
      TAG_NAMES2["DIR"] = "dir";
      TAG_NAMES2["DIV"] = "div";
      TAG_NAMES2["DL"] = "dl";
      TAG_NAMES2["DT"] = "dt";
      TAG_NAMES2["EM"] = "em";
      TAG_NAMES2["EMBED"] = "embed";
      TAG_NAMES2["FIELDSET"] = "fieldset";
      TAG_NAMES2["FIGCAPTION"] = "figcaption";
      TAG_NAMES2["FIGURE"] = "figure";
      TAG_NAMES2["FONT"] = "font";
      TAG_NAMES2["FOOTER"] = "footer";
      TAG_NAMES2["FOREIGN_OBJECT"] = "foreignObject";
      TAG_NAMES2["FORM"] = "form";
      TAG_NAMES2["FRAME"] = "frame";
      TAG_NAMES2["FRAMESET"] = "frameset";
      TAG_NAMES2["H1"] = "h1";
      TAG_NAMES2["H2"] = "h2";
      TAG_NAMES2["H3"] = "h3";
      TAG_NAMES2["H4"] = "h4";
      TAG_NAMES2["H5"] = "h5";
      TAG_NAMES2["H6"] = "h6";
      TAG_NAMES2["HEAD"] = "head";
      TAG_NAMES2["HEADER"] = "header";
      TAG_NAMES2["HGROUP"] = "hgroup";
      TAG_NAMES2["HR"] = "hr";
      TAG_NAMES2["HTML"] = "html";
      TAG_NAMES2["I"] = "i";
      TAG_NAMES2["IMG"] = "img";
      TAG_NAMES2["IMAGE"] = "image";
      TAG_NAMES2["INPUT"] = "input";
      TAG_NAMES2["IFRAME"] = "iframe";
      TAG_NAMES2["KEYGEN"] = "keygen";
      TAG_NAMES2["LABEL"] = "label";
      TAG_NAMES2["LI"] = "li";
      TAG_NAMES2["LINK"] = "link";
      TAG_NAMES2["LISTING"] = "listing";
      TAG_NAMES2["MAIN"] = "main";
      TAG_NAMES2["MALIGNMARK"] = "malignmark";
      TAG_NAMES2["MARQUEE"] = "marquee";
      TAG_NAMES2["MATH"] = "math";
      TAG_NAMES2["MENU"] = "menu";
      TAG_NAMES2["META"] = "meta";
      TAG_NAMES2["MGLYPH"] = "mglyph";
      TAG_NAMES2["MI"] = "mi";
      TAG_NAMES2["MO"] = "mo";
      TAG_NAMES2["MN"] = "mn";
      TAG_NAMES2["MS"] = "ms";
      TAG_NAMES2["MTEXT"] = "mtext";
      TAG_NAMES2["NAV"] = "nav";
      TAG_NAMES2["NOBR"] = "nobr";
      TAG_NAMES2["NOFRAMES"] = "noframes";
      TAG_NAMES2["NOEMBED"] = "noembed";
      TAG_NAMES2["NOSCRIPT"] = "noscript";
      TAG_NAMES2["OBJECT"] = "object";
      TAG_NAMES2["OL"] = "ol";
      TAG_NAMES2["OPTGROUP"] = "optgroup";
      TAG_NAMES2["OPTION"] = "option";
      TAG_NAMES2["P"] = "p";
      TAG_NAMES2["PARAM"] = "param";
      TAG_NAMES2["PLAINTEXT"] = "plaintext";
      TAG_NAMES2["PRE"] = "pre";
      TAG_NAMES2["RB"] = "rb";
      TAG_NAMES2["RP"] = "rp";
      TAG_NAMES2["RT"] = "rt";
      TAG_NAMES2["RTC"] = "rtc";
      TAG_NAMES2["RUBY"] = "ruby";
      TAG_NAMES2["S"] = "s";
      TAG_NAMES2["SCRIPT"] = "script";
      TAG_NAMES2["SEARCH"] = "search";
      TAG_NAMES2["SECTION"] = "section";
      TAG_NAMES2["SELECT"] = "select";
      TAG_NAMES2["SOURCE"] = "source";
      TAG_NAMES2["SMALL"] = "small";
      TAG_NAMES2["SPAN"] = "span";
      TAG_NAMES2["STRIKE"] = "strike";
      TAG_NAMES2["STRONG"] = "strong";
      TAG_NAMES2["STYLE"] = "style";
      TAG_NAMES2["SUB"] = "sub";
      TAG_NAMES2["SUMMARY"] = "summary";
      TAG_NAMES2["SUP"] = "sup";
      TAG_NAMES2["TABLE"] = "table";
      TAG_NAMES2["TBODY"] = "tbody";
      TAG_NAMES2["TEMPLATE"] = "template";
      TAG_NAMES2["TEXTAREA"] = "textarea";
      TAG_NAMES2["TFOOT"] = "tfoot";
      TAG_NAMES2["TD"] = "td";
      TAG_NAMES2["TH"] = "th";
      TAG_NAMES2["THEAD"] = "thead";
      TAG_NAMES2["TITLE"] = "title";
      TAG_NAMES2["TR"] = "tr";
      TAG_NAMES2["TRACK"] = "track";
      TAG_NAMES2["TT"] = "tt";
      TAG_NAMES2["U"] = "u";
      TAG_NAMES2["UL"] = "ul";
      TAG_NAMES2["SVG"] = "svg";
      TAG_NAMES2["VAR"] = "var";
      TAG_NAMES2["WBR"] = "wbr";
      TAG_NAMES2["XMP"] = "xmp";
    })(TAG_NAMES || (TAG_NAMES = {}));
    (function(TAG_ID2) {
      TAG_ID2[TAG_ID2["UNKNOWN"] = 0] = "UNKNOWN";
      TAG_ID2[TAG_ID2["A"] = 1] = "A";
      TAG_ID2[TAG_ID2["ADDRESS"] = 2] = "ADDRESS";
      TAG_ID2[TAG_ID2["ANNOTATION_XML"] = 3] = "ANNOTATION_XML";
      TAG_ID2[TAG_ID2["APPLET"] = 4] = "APPLET";
      TAG_ID2[TAG_ID2["AREA"] = 5] = "AREA";
      TAG_ID2[TAG_ID2["ARTICLE"] = 6] = "ARTICLE";
      TAG_ID2[TAG_ID2["ASIDE"] = 7] = "ASIDE";
      TAG_ID2[TAG_ID2["B"] = 8] = "B";
      TAG_ID2[TAG_ID2["BASE"] = 9] = "BASE";
      TAG_ID2[TAG_ID2["BASEFONT"] = 10] = "BASEFONT";
      TAG_ID2[TAG_ID2["BGSOUND"] = 11] = "BGSOUND";
      TAG_ID2[TAG_ID2["BIG"] = 12] = "BIG";
      TAG_ID2[TAG_ID2["BLOCKQUOTE"] = 13] = "BLOCKQUOTE";
      TAG_ID2[TAG_ID2["BODY"] = 14] = "BODY";
      TAG_ID2[TAG_ID2["BR"] = 15] = "BR";
      TAG_ID2[TAG_ID2["BUTTON"] = 16] = "BUTTON";
      TAG_ID2[TAG_ID2["CAPTION"] = 17] = "CAPTION";
      TAG_ID2[TAG_ID2["CENTER"] = 18] = "CENTER";
      TAG_ID2[TAG_ID2["CODE"] = 19] = "CODE";
      TAG_ID2[TAG_ID2["COL"] = 20] = "COL";
      TAG_ID2[TAG_ID2["COLGROUP"] = 21] = "COLGROUP";
      TAG_ID2[TAG_ID2["DD"] = 22] = "DD";
      TAG_ID2[TAG_ID2["DESC"] = 23] = "DESC";
      TAG_ID2[TAG_ID2["DETAILS"] = 24] = "DETAILS";
      TAG_ID2[TAG_ID2["DIALOG"] = 25] = "DIALOG";
      TAG_ID2[TAG_ID2["DIR"] = 26] = "DIR";
      TAG_ID2[TAG_ID2["DIV"] = 27] = "DIV";
      TAG_ID2[TAG_ID2["DL"] = 28] = "DL";
      TAG_ID2[TAG_ID2["DT"] = 29] = "DT";
      TAG_ID2[TAG_ID2["EM"] = 30] = "EM";
      TAG_ID2[TAG_ID2["EMBED"] = 31] = "EMBED";
      TAG_ID2[TAG_ID2["FIELDSET"] = 32] = "FIELDSET";
      TAG_ID2[TAG_ID2["FIGCAPTION"] = 33] = "FIGCAPTION";
      TAG_ID2[TAG_ID2["FIGURE"] = 34] = "FIGURE";
      TAG_ID2[TAG_ID2["FONT"] = 35] = "FONT";
      TAG_ID2[TAG_ID2["FOOTER"] = 36] = "FOOTER";
      TAG_ID2[TAG_ID2["FOREIGN_OBJECT"] = 37] = "FOREIGN_OBJECT";
      TAG_ID2[TAG_ID2["FORM"] = 38] = "FORM";
      TAG_ID2[TAG_ID2["FRAME"] = 39] = "FRAME";
      TAG_ID2[TAG_ID2["FRAMESET"] = 40] = "FRAMESET";
      TAG_ID2[TAG_ID2["H1"] = 41] = "H1";
      TAG_ID2[TAG_ID2["H2"] = 42] = "H2";
      TAG_ID2[TAG_ID2["H3"] = 43] = "H3";
      TAG_ID2[TAG_ID2["H4"] = 44] = "H4";
      TAG_ID2[TAG_ID2["H5"] = 45] = "H5";
      TAG_ID2[TAG_ID2["H6"] = 46] = "H6";
      TAG_ID2[TAG_ID2["HEAD"] = 47] = "HEAD";
      TAG_ID2[TAG_ID2["HEADER"] = 48] = "HEADER";
      TAG_ID2[TAG_ID2["HGROUP"] = 49] = "HGROUP";
      TAG_ID2[TAG_ID2["HR"] = 50] = "HR";
      TAG_ID2[TAG_ID2["HTML"] = 51] = "HTML";
      TAG_ID2[TAG_ID2["I"] = 52] = "I";
      TAG_ID2[TAG_ID2["IMG"] = 53] = "IMG";
      TAG_ID2[TAG_ID2["IMAGE"] = 54] = "IMAGE";
      TAG_ID2[TAG_ID2["INPUT"] = 55] = "INPUT";
      TAG_ID2[TAG_ID2["IFRAME"] = 56] = "IFRAME";
      TAG_ID2[TAG_ID2["KEYGEN"] = 57] = "KEYGEN";
      TAG_ID2[TAG_ID2["LABEL"] = 58] = "LABEL";
      TAG_ID2[TAG_ID2["LI"] = 59] = "LI";
      TAG_ID2[TAG_ID2["LINK"] = 60] = "LINK";
      TAG_ID2[TAG_ID2["LISTING"] = 61] = "LISTING";
      TAG_ID2[TAG_ID2["MAIN"] = 62] = "MAIN";
      TAG_ID2[TAG_ID2["MALIGNMARK"] = 63] = "MALIGNMARK";
      TAG_ID2[TAG_ID2["MARQUEE"] = 64] = "MARQUEE";
      TAG_ID2[TAG_ID2["MATH"] = 65] = "MATH";
      TAG_ID2[TAG_ID2["MENU"] = 66] = "MENU";
      TAG_ID2[TAG_ID2["META"] = 67] = "META";
      TAG_ID2[TAG_ID2["MGLYPH"] = 68] = "MGLYPH";
      TAG_ID2[TAG_ID2["MI"] = 69] = "MI";
      TAG_ID2[TAG_ID2["MO"] = 70] = "MO";
      TAG_ID2[TAG_ID2["MN"] = 71] = "MN";
      TAG_ID2[TAG_ID2["MS"] = 72] = "MS";
      TAG_ID2[TAG_ID2["MTEXT"] = 73] = "MTEXT";
      TAG_ID2[TAG_ID2["NAV"] = 74] = "NAV";
      TAG_ID2[TAG_ID2["NOBR"] = 75] = "NOBR";
      TAG_ID2[TAG_ID2["NOFRAMES"] = 76] = "NOFRAMES";
      TAG_ID2[TAG_ID2["NOEMBED"] = 77] = "NOEMBED";
      TAG_ID2[TAG_ID2["NOSCRIPT"] = 78] = "NOSCRIPT";
      TAG_ID2[TAG_ID2["OBJECT"] = 79] = "OBJECT";
      TAG_ID2[TAG_ID2["OL"] = 80] = "OL";
      TAG_ID2[TAG_ID2["OPTGROUP"] = 81] = "OPTGROUP";
      TAG_ID2[TAG_ID2["OPTION"] = 82] = "OPTION";
      TAG_ID2[TAG_ID2["P"] = 83] = "P";
      TAG_ID2[TAG_ID2["PARAM"] = 84] = "PARAM";
      TAG_ID2[TAG_ID2["PLAINTEXT"] = 85] = "PLAINTEXT";
      TAG_ID2[TAG_ID2["PRE"] = 86] = "PRE";
      TAG_ID2[TAG_ID2["RB"] = 87] = "RB";
      TAG_ID2[TAG_ID2["RP"] = 88] = "RP";
      TAG_ID2[TAG_ID2["RT"] = 89] = "RT";
      TAG_ID2[TAG_ID2["RTC"] = 90] = "RTC";
      TAG_ID2[TAG_ID2["RUBY"] = 91] = "RUBY";
      TAG_ID2[TAG_ID2["S"] = 92] = "S";
      TAG_ID2[TAG_ID2["SCRIPT"] = 93] = "SCRIPT";
      TAG_ID2[TAG_ID2["SEARCH"] = 94] = "SEARCH";
      TAG_ID2[TAG_ID2["SECTION"] = 95] = "SECTION";
      TAG_ID2[TAG_ID2["SELECT"] = 96] = "SELECT";
      TAG_ID2[TAG_ID2["SOURCE"] = 97] = "SOURCE";
      TAG_ID2[TAG_ID2["SMALL"] = 98] = "SMALL";
      TAG_ID2[TAG_ID2["SPAN"] = 99] = "SPAN";
      TAG_ID2[TAG_ID2["STRIKE"] = 100] = "STRIKE";
      TAG_ID2[TAG_ID2["STRONG"] = 101] = "STRONG";
      TAG_ID2[TAG_ID2["STYLE"] = 102] = "STYLE";
      TAG_ID2[TAG_ID2["SUB"] = 103] = "SUB";
      TAG_ID2[TAG_ID2["SUMMARY"] = 104] = "SUMMARY";
      TAG_ID2[TAG_ID2["SUP"] = 105] = "SUP";
      TAG_ID2[TAG_ID2["TABLE"] = 106] = "TABLE";
      TAG_ID2[TAG_ID2["TBODY"] = 107] = "TBODY";
      TAG_ID2[TAG_ID2["TEMPLATE"] = 108] = "TEMPLATE";
      TAG_ID2[TAG_ID2["TEXTAREA"] = 109] = "TEXTAREA";
      TAG_ID2[TAG_ID2["TFOOT"] = 110] = "TFOOT";
      TAG_ID2[TAG_ID2["TD"] = 111] = "TD";
      TAG_ID2[TAG_ID2["TH"] = 112] = "TH";
      TAG_ID2[TAG_ID2["THEAD"] = 113] = "THEAD";
      TAG_ID2[TAG_ID2["TITLE"] = 114] = "TITLE";
      TAG_ID2[TAG_ID2["TR"] = 115] = "TR";
      TAG_ID2[TAG_ID2["TRACK"] = 116] = "TRACK";
      TAG_ID2[TAG_ID2["TT"] = 117] = "TT";
      TAG_ID2[TAG_ID2["U"] = 118] = "U";
      TAG_ID2[TAG_ID2["UL"] = 119] = "UL";
      TAG_ID2[TAG_ID2["SVG"] = 120] = "SVG";
      TAG_ID2[TAG_ID2["VAR"] = 121] = "VAR";
      TAG_ID2[TAG_ID2["WBR"] = 122] = "WBR";
      TAG_ID2[TAG_ID2["XMP"] = 123] = "XMP";
    })(TAG_ID || (TAG_ID = {}));
    TAG_NAME_TO_ID = /* @__PURE__ */ new Map([
      [TAG_NAMES.A, TAG_ID.A],
      [TAG_NAMES.ADDRESS, TAG_ID.ADDRESS],
      [TAG_NAMES.ANNOTATION_XML, TAG_ID.ANNOTATION_XML],
      [TAG_NAMES.APPLET, TAG_ID.APPLET],
      [TAG_NAMES.AREA, TAG_ID.AREA],
      [TAG_NAMES.ARTICLE, TAG_ID.ARTICLE],
      [TAG_NAMES.ASIDE, TAG_ID.ASIDE],
      [TAG_NAMES.B, TAG_ID.B],
      [TAG_NAMES.BASE, TAG_ID.BASE],
      [TAG_NAMES.BASEFONT, TAG_ID.BASEFONT],
      [TAG_NAMES.BGSOUND, TAG_ID.BGSOUND],
      [TAG_NAMES.BIG, TAG_ID.BIG],
      [TAG_NAMES.BLOCKQUOTE, TAG_ID.BLOCKQUOTE],
      [TAG_NAMES.BODY, TAG_ID.BODY],
      [TAG_NAMES.BR, TAG_ID.BR],
      [TAG_NAMES.BUTTON, TAG_ID.BUTTON],
      [TAG_NAMES.CAPTION, TAG_ID.CAPTION],
      [TAG_NAMES.CENTER, TAG_ID.CENTER],
      [TAG_NAMES.CODE, TAG_ID.CODE],
      [TAG_NAMES.COL, TAG_ID.COL],
      [TAG_NAMES.COLGROUP, TAG_ID.COLGROUP],
      [TAG_NAMES.DD, TAG_ID.DD],
      [TAG_NAMES.DESC, TAG_ID.DESC],
      [TAG_NAMES.DETAILS, TAG_ID.DETAILS],
      [TAG_NAMES.DIALOG, TAG_ID.DIALOG],
      [TAG_NAMES.DIR, TAG_ID.DIR],
      [TAG_NAMES.DIV, TAG_ID.DIV],
      [TAG_NAMES.DL, TAG_ID.DL],
      [TAG_NAMES.DT, TAG_ID.DT],
      [TAG_NAMES.EM, TAG_ID.EM],
      [TAG_NAMES.EMBED, TAG_ID.EMBED],
      [TAG_NAMES.FIELDSET, TAG_ID.FIELDSET],
      [TAG_NAMES.FIGCAPTION, TAG_ID.FIGCAPTION],
      [TAG_NAMES.FIGURE, TAG_ID.FIGURE],
      [TAG_NAMES.FONT, TAG_ID.FONT],
      [TAG_NAMES.FOOTER, TAG_ID.FOOTER],
      [TAG_NAMES.FOREIGN_OBJECT, TAG_ID.FOREIGN_OBJECT],
      [TAG_NAMES.FORM, TAG_ID.FORM],
      [TAG_NAMES.FRAME, TAG_ID.FRAME],
      [TAG_NAMES.FRAMESET, TAG_ID.FRAMESET],
      [TAG_NAMES.H1, TAG_ID.H1],
      [TAG_NAMES.H2, TAG_ID.H2],
      [TAG_NAMES.H3, TAG_ID.H3],
      [TAG_NAMES.H4, TAG_ID.H4],
      [TAG_NAMES.H5, TAG_ID.H5],
      [TAG_NAMES.H6, TAG_ID.H6],
      [TAG_NAMES.HEAD, TAG_ID.HEAD],
      [TAG_NAMES.HEADER, TAG_ID.HEADER],
      [TAG_NAMES.HGROUP, TAG_ID.HGROUP],
      [TAG_NAMES.HR, TAG_ID.HR],
      [TAG_NAMES.HTML, TAG_ID.HTML],
      [TAG_NAMES.I, TAG_ID.I],
      [TAG_NAMES.IMG, TAG_ID.IMG],
      [TAG_NAMES.IMAGE, TAG_ID.IMAGE],
      [TAG_NAMES.INPUT, TAG_ID.INPUT],
      [TAG_NAMES.IFRAME, TAG_ID.IFRAME],
      [TAG_NAMES.KEYGEN, TAG_ID.KEYGEN],
      [TAG_NAMES.LABEL, TAG_ID.LABEL],
      [TAG_NAMES.LI, TAG_ID.LI],
      [TAG_NAMES.LINK, TAG_ID.LINK],
      [TAG_NAMES.LISTING, TAG_ID.LISTING],
      [TAG_NAMES.MAIN, TAG_ID.MAIN],
      [TAG_NAMES.MALIGNMARK, TAG_ID.MALIGNMARK],
      [TAG_NAMES.MARQUEE, TAG_ID.MARQUEE],
      [TAG_NAMES.MATH, TAG_ID.MATH],
      [TAG_NAMES.MENU, TAG_ID.MENU],
      [TAG_NAMES.META, TAG_ID.META],
      [TAG_NAMES.MGLYPH, TAG_ID.MGLYPH],
      [TAG_NAMES.MI, TAG_ID.MI],
      [TAG_NAMES.MO, TAG_ID.MO],
      [TAG_NAMES.MN, TAG_ID.MN],
      [TAG_NAMES.MS, TAG_ID.MS],
      [TAG_NAMES.MTEXT, TAG_ID.MTEXT],
      [TAG_NAMES.NAV, TAG_ID.NAV],
      [TAG_NAMES.NOBR, TAG_ID.NOBR],
      [TAG_NAMES.NOFRAMES, TAG_ID.NOFRAMES],
      [TAG_NAMES.NOEMBED, TAG_ID.NOEMBED],
      [TAG_NAMES.NOSCRIPT, TAG_ID.NOSCRIPT],
      [TAG_NAMES.OBJECT, TAG_ID.OBJECT],
      [TAG_NAMES.OL, TAG_ID.OL],
      [TAG_NAMES.OPTGROUP, TAG_ID.OPTGROUP],
      [TAG_NAMES.OPTION, TAG_ID.OPTION],
      [TAG_NAMES.P, TAG_ID.P],
      [TAG_NAMES.PARAM, TAG_ID.PARAM],
      [TAG_NAMES.PLAINTEXT, TAG_ID.PLAINTEXT],
      [TAG_NAMES.PRE, TAG_ID.PRE],
      [TAG_NAMES.RB, TAG_ID.RB],
      [TAG_NAMES.RP, TAG_ID.RP],
      [TAG_NAMES.RT, TAG_ID.RT],
      [TAG_NAMES.RTC, TAG_ID.RTC],
      [TAG_NAMES.RUBY, TAG_ID.RUBY],
      [TAG_NAMES.S, TAG_ID.S],
      [TAG_NAMES.SCRIPT, TAG_ID.SCRIPT],
      [TAG_NAMES.SEARCH, TAG_ID.SEARCH],
      [TAG_NAMES.SECTION, TAG_ID.SECTION],
      [TAG_NAMES.SELECT, TAG_ID.SELECT],
      [TAG_NAMES.SOURCE, TAG_ID.SOURCE],
      [TAG_NAMES.SMALL, TAG_ID.SMALL],
      [TAG_NAMES.SPAN, TAG_ID.SPAN],
      [TAG_NAMES.STRIKE, TAG_ID.STRIKE],
      [TAG_NAMES.STRONG, TAG_ID.STRONG],
      [TAG_NAMES.STYLE, TAG_ID.STYLE],
      [TAG_NAMES.SUB, TAG_ID.SUB],
      [TAG_NAMES.SUMMARY, TAG_ID.SUMMARY],
      [TAG_NAMES.SUP, TAG_ID.SUP],
      [TAG_NAMES.TABLE, TAG_ID.TABLE],
      [TAG_NAMES.TBODY, TAG_ID.TBODY],
      [TAG_NAMES.TEMPLATE, TAG_ID.TEMPLATE],
      [TAG_NAMES.TEXTAREA, TAG_ID.TEXTAREA],
      [TAG_NAMES.TFOOT, TAG_ID.TFOOT],
      [TAG_NAMES.TD, TAG_ID.TD],
      [TAG_NAMES.TH, TAG_ID.TH],
      [TAG_NAMES.THEAD, TAG_ID.THEAD],
      [TAG_NAMES.TITLE, TAG_ID.TITLE],
      [TAG_NAMES.TR, TAG_ID.TR],
      [TAG_NAMES.TRACK, TAG_ID.TRACK],
      [TAG_NAMES.TT, TAG_ID.TT],
      [TAG_NAMES.U, TAG_ID.U],
      [TAG_NAMES.UL, TAG_ID.UL],
      [TAG_NAMES.SVG, TAG_ID.SVG],
      [TAG_NAMES.VAR, TAG_ID.VAR],
      [TAG_NAMES.WBR, TAG_ID.WBR],
      [TAG_NAMES.XMP, TAG_ID.XMP]
    ]);
    $ = TAG_ID;
    SPECIAL_ELEMENTS = {
      [NS.HTML]: /* @__PURE__ */ new Set([
        $.ADDRESS,
        $.APPLET,
        $.AREA,
        $.ARTICLE,
        $.ASIDE,
        $.BASE,
        $.BASEFONT,
        $.BGSOUND,
        $.BLOCKQUOTE,
        $.BODY,
        $.BR,
        $.BUTTON,
        $.CAPTION,
        $.CENTER,
        $.COL,
        $.COLGROUP,
        $.DD,
        $.DETAILS,
        $.DIR,
        $.DIV,
        $.DL,
        $.DT,
        $.EMBED,
        $.FIELDSET,
        $.FIGCAPTION,
        $.FIGURE,
        $.FOOTER,
        $.FORM,
        $.FRAME,
        $.FRAMESET,
        $.H1,
        $.H2,
        $.H3,
        $.H4,
        $.H5,
        $.H6,
        $.HEAD,
        $.HEADER,
        $.HGROUP,
        $.HR,
        $.HTML,
        $.IFRAME,
        $.IMG,
        $.INPUT,
        $.LI,
        $.LINK,
        $.LISTING,
        $.MAIN,
        $.MARQUEE,
        $.MENU,
        $.META,
        $.NAV,
        $.NOEMBED,
        $.NOFRAMES,
        $.NOSCRIPT,
        $.OBJECT,
        $.OL,
        $.P,
        $.PARAM,
        $.PLAINTEXT,
        $.PRE,
        $.SCRIPT,
        $.SECTION,
        $.SELECT,
        $.SOURCE,
        $.STYLE,
        $.SUMMARY,
        $.TABLE,
        $.TBODY,
        $.TD,
        $.TEMPLATE,
        $.TEXTAREA,
        $.TFOOT,
        $.TH,
        $.THEAD,
        $.TITLE,
        $.TR,
        $.TRACK,
        $.UL,
        $.WBR,
        $.XMP
      ]),
      [NS.MATHML]: /* @__PURE__ */ new Set([$.MI, $.MO, $.MN, $.MS, $.MTEXT, $.ANNOTATION_XML]),
      [NS.SVG]: /* @__PURE__ */ new Set([$.TITLE, $.FOREIGN_OBJECT, $.DESC]),
      [NS.XLINK]: /* @__PURE__ */ new Set(),
      [NS.XML]: /* @__PURE__ */ new Set(),
      [NS.XMLNS]: /* @__PURE__ */ new Set()
    };
    NUMBERED_HEADERS = /* @__PURE__ */ new Set([$.H1, $.H2, $.H3, $.H4, $.H5, $.H6]);
    UNESCAPED_TEXT = /* @__PURE__ */ new Set([
      TAG_NAMES.STYLE,
      TAG_NAMES.SCRIPT,
      TAG_NAMES.XMP,
      TAG_NAMES.IFRAME,
      TAG_NAMES.NOEMBED,
      TAG_NAMES.NOFRAMES,
      TAG_NAMES.PLAINTEXT
    ]);
  }
});

// node_modules/parse5/dist/tokenizer/index.js
var State, TokenizerMode;
var init_tokenizer = __esm({
  "node_modules/parse5/dist/tokenizer/index.js"() {
    "use strict";
    init_preprocessor();
    init_unicode();
    init_token();
    init_decode();
    init_error_codes();
    init_html();
    (function(State2) {
      State2[State2["DATA"] = 0] = "DATA";
      State2[State2["RCDATA"] = 1] = "RCDATA";
      State2[State2["RAWTEXT"] = 2] = "RAWTEXT";
      State2[State2["SCRIPT_DATA"] = 3] = "SCRIPT_DATA";
      State2[State2["PLAINTEXT"] = 4] = "PLAINTEXT";
      State2[State2["TAG_OPEN"] = 5] = "TAG_OPEN";
      State2[State2["END_TAG_OPEN"] = 6] = "END_TAG_OPEN";
      State2[State2["TAG_NAME"] = 7] = "TAG_NAME";
      State2[State2["RCDATA_LESS_THAN_SIGN"] = 8] = "RCDATA_LESS_THAN_SIGN";
      State2[State2["RCDATA_END_TAG_OPEN"] = 9] = "RCDATA_END_TAG_OPEN";
      State2[State2["RCDATA_END_TAG_NAME"] = 10] = "RCDATA_END_TAG_NAME";
      State2[State2["RAWTEXT_LESS_THAN_SIGN"] = 11] = "RAWTEXT_LESS_THAN_SIGN";
      State2[State2["RAWTEXT_END_TAG_OPEN"] = 12] = "RAWTEXT_END_TAG_OPEN";
      State2[State2["RAWTEXT_END_TAG_NAME"] = 13] = "RAWTEXT_END_TAG_NAME";
      State2[State2["SCRIPT_DATA_LESS_THAN_SIGN"] = 14] = "SCRIPT_DATA_LESS_THAN_SIGN";
      State2[State2["SCRIPT_DATA_END_TAG_OPEN"] = 15] = "SCRIPT_DATA_END_TAG_OPEN";
      State2[State2["SCRIPT_DATA_END_TAG_NAME"] = 16] = "SCRIPT_DATA_END_TAG_NAME";
      State2[State2["SCRIPT_DATA_ESCAPE_START"] = 17] = "SCRIPT_DATA_ESCAPE_START";
      State2[State2["SCRIPT_DATA_ESCAPE_START_DASH"] = 18] = "SCRIPT_DATA_ESCAPE_START_DASH";
      State2[State2["SCRIPT_DATA_ESCAPED"] = 19] = "SCRIPT_DATA_ESCAPED";
      State2[State2["SCRIPT_DATA_ESCAPED_DASH"] = 20] = "SCRIPT_DATA_ESCAPED_DASH";
      State2[State2["SCRIPT_DATA_ESCAPED_DASH_DASH"] = 21] = "SCRIPT_DATA_ESCAPED_DASH_DASH";
      State2[State2["SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN"] = 22] = "SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN";
      State2[State2["SCRIPT_DATA_ESCAPED_END_TAG_OPEN"] = 23] = "SCRIPT_DATA_ESCAPED_END_TAG_OPEN";
      State2[State2["SCRIPT_DATA_ESCAPED_END_TAG_NAME"] = 24] = "SCRIPT_DATA_ESCAPED_END_TAG_NAME";
      State2[State2["SCRIPT_DATA_DOUBLE_ESCAPE_START"] = 25] = "SCRIPT_DATA_DOUBLE_ESCAPE_START";
      State2[State2["SCRIPT_DATA_DOUBLE_ESCAPED"] = 26] = "SCRIPT_DATA_DOUBLE_ESCAPED";
      State2[State2["SCRIPT_DATA_DOUBLE_ESCAPED_DASH"] = 27] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH";
      State2[State2["SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH"] = 28] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH";
      State2[State2["SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN"] = 29] = "SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN";
      State2[State2["SCRIPT_DATA_DOUBLE_ESCAPE_END"] = 30] = "SCRIPT_DATA_DOUBLE_ESCAPE_END";
      State2[State2["BEFORE_ATTRIBUTE_NAME"] = 31] = "BEFORE_ATTRIBUTE_NAME";
      State2[State2["ATTRIBUTE_NAME"] = 32] = "ATTRIBUTE_NAME";
      State2[State2["AFTER_ATTRIBUTE_NAME"] = 33] = "AFTER_ATTRIBUTE_NAME";
      State2[State2["BEFORE_ATTRIBUTE_VALUE"] = 34] = "BEFORE_ATTRIBUTE_VALUE";
      State2[State2["ATTRIBUTE_VALUE_DOUBLE_QUOTED"] = 35] = "ATTRIBUTE_VALUE_DOUBLE_QUOTED";
      State2[State2["ATTRIBUTE_VALUE_SINGLE_QUOTED"] = 36] = "ATTRIBUTE_VALUE_SINGLE_QUOTED";
      State2[State2["ATTRIBUTE_VALUE_UNQUOTED"] = 37] = "ATTRIBUTE_VALUE_UNQUOTED";
      State2[State2["AFTER_ATTRIBUTE_VALUE_QUOTED"] = 38] = "AFTER_ATTRIBUTE_VALUE_QUOTED";
      State2[State2["SELF_CLOSING_START_TAG"] = 39] = "SELF_CLOSING_START_TAG";
      State2[State2["BOGUS_COMMENT"] = 40] = "BOGUS_COMMENT";
      State2[State2["MARKUP_DECLARATION_OPEN"] = 41] = "MARKUP_DECLARATION_OPEN";
      State2[State2["COMMENT_START"] = 42] = "COMMENT_START";
      State2[State2["COMMENT_START_DASH"] = 43] = "COMMENT_START_DASH";
      State2[State2["COMMENT"] = 44] = "COMMENT";
      State2[State2["COMMENT_LESS_THAN_SIGN"] = 45] = "COMMENT_LESS_THAN_SIGN";
      State2[State2["COMMENT_LESS_THAN_SIGN_BANG"] = 46] = "COMMENT_LESS_THAN_SIGN_BANG";
      State2[State2["COMMENT_LESS_THAN_SIGN_BANG_DASH"] = 47] = "COMMENT_LESS_THAN_SIGN_BANG_DASH";
      State2[State2["COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH"] = 48] = "COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH";
      State2[State2["COMMENT_END_DASH"] = 49] = "COMMENT_END_DASH";
      State2[State2["COMMENT_END"] = 50] = "COMMENT_END";
      State2[State2["COMMENT_END_BANG"] = 51] = "COMMENT_END_BANG";
      State2[State2["DOCTYPE"] = 52] = "DOCTYPE";
      State2[State2["BEFORE_DOCTYPE_NAME"] = 53] = "BEFORE_DOCTYPE_NAME";
      State2[State2["DOCTYPE_NAME"] = 54] = "DOCTYPE_NAME";
      State2[State2["AFTER_DOCTYPE_NAME"] = 55] = "AFTER_DOCTYPE_NAME";
      State2[State2["AFTER_DOCTYPE_PUBLIC_KEYWORD"] = 56] = "AFTER_DOCTYPE_PUBLIC_KEYWORD";
      State2[State2["BEFORE_DOCTYPE_PUBLIC_IDENTIFIER"] = 57] = "BEFORE_DOCTYPE_PUBLIC_IDENTIFIER";
      State2[State2["DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED"] = 58] = "DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED";
      State2[State2["DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED"] = 59] = "DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED";
      State2[State2["AFTER_DOCTYPE_PUBLIC_IDENTIFIER"] = 60] = "AFTER_DOCTYPE_PUBLIC_IDENTIFIER";
      State2[State2["BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS"] = 61] = "BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS";
      State2[State2["AFTER_DOCTYPE_SYSTEM_KEYWORD"] = 62] = "AFTER_DOCTYPE_SYSTEM_KEYWORD";
      State2[State2["BEFORE_DOCTYPE_SYSTEM_IDENTIFIER"] = 63] = "BEFORE_DOCTYPE_SYSTEM_IDENTIFIER";
      State2[State2["DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED"] = 64] = "DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED";
      State2[State2["DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED"] = 65] = "DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED";
      State2[State2["AFTER_DOCTYPE_SYSTEM_IDENTIFIER"] = 66] = "AFTER_DOCTYPE_SYSTEM_IDENTIFIER";
      State2[State2["BOGUS_DOCTYPE"] = 67] = "BOGUS_DOCTYPE";
      State2[State2["CDATA_SECTION"] = 68] = "CDATA_SECTION";
      State2[State2["CDATA_SECTION_BRACKET"] = 69] = "CDATA_SECTION_BRACKET";
      State2[State2["CDATA_SECTION_END"] = 70] = "CDATA_SECTION_END";
      State2[State2["CHARACTER_REFERENCE"] = 71] = "CHARACTER_REFERENCE";
      State2[State2["AMBIGUOUS_AMPERSAND"] = 72] = "AMBIGUOUS_AMPERSAND";
    })(State || (State = {}));
    TokenizerMode = {
      DATA: State.DATA,
      RCDATA: State.RCDATA,
      RAWTEXT: State.RAWTEXT,
      SCRIPT_DATA: State.SCRIPT_DATA,
      PLAINTEXT: State.PLAINTEXT,
      CDATA_SECTION: State.CDATA_SECTION
    };
  }
});

// node_modules/parse5/dist/parser/open-element-stack.js
var IMPLICIT_END_TAG_REQUIRED, IMPLICIT_END_TAG_REQUIRED_THOROUGHLY, SCOPING_ELEMENTS_HTML, SCOPING_ELEMENTS_HTML_LIST, SCOPING_ELEMENTS_HTML_BUTTON, SCOPING_ELEMENTS_MATHML, SCOPING_ELEMENTS_SVG, TABLE_ROW_CONTEXT, TABLE_BODY_CONTEXT, TABLE_CONTEXT, TABLE_CELLS;
var init_open_element_stack = __esm({
  "node_modules/parse5/dist/parser/open-element-stack.js"() {
    "use strict";
    init_html();
    IMPLICIT_END_TAG_REQUIRED = /* @__PURE__ */ new Set([TAG_ID.DD, TAG_ID.DT, TAG_ID.LI, TAG_ID.OPTGROUP, TAG_ID.OPTION, TAG_ID.P, TAG_ID.RB, TAG_ID.RP, TAG_ID.RT, TAG_ID.RTC]);
    IMPLICIT_END_TAG_REQUIRED_THOROUGHLY = /* @__PURE__ */ new Set([
      ...IMPLICIT_END_TAG_REQUIRED,
      TAG_ID.CAPTION,
      TAG_ID.COLGROUP,
      TAG_ID.TBODY,
      TAG_ID.TD,
      TAG_ID.TFOOT,
      TAG_ID.TH,
      TAG_ID.THEAD,
      TAG_ID.TR
    ]);
    SCOPING_ELEMENTS_HTML = /* @__PURE__ */ new Set([
      TAG_ID.APPLET,
      TAG_ID.CAPTION,
      TAG_ID.HTML,
      TAG_ID.MARQUEE,
      TAG_ID.OBJECT,
      TAG_ID.TABLE,
      TAG_ID.TD,
      TAG_ID.TEMPLATE,
      TAG_ID.TH
    ]);
    SCOPING_ELEMENTS_HTML_LIST = /* @__PURE__ */ new Set([...SCOPING_ELEMENTS_HTML, TAG_ID.OL, TAG_ID.UL]);
    SCOPING_ELEMENTS_HTML_BUTTON = /* @__PURE__ */ new Set([...SCOPING_ELEMENTS_HTML, TAG_ID.BUTTON]);
    SCOPING_ELEMENTS_MATHML = /* @__PURE__ */ new Set([TAG_ID.ANNOTATION_XML, TAG_ID.MI, TAG_ID.MN, TAG_ID.MO, TAG_ID.MS, TAG_ID.MTEXT]);
    SCOPING_ELEMENTS_SVG = /* @__PURE__ */ new Set([TAG_ID.DESC, TAG_ID.FOREIGN_OBJECT, TAG_ID.TITLE]);
    TABLE_ROW_CONTEXT = /* @__PURE__ */ new Set([TAG_ID.TR, TAG_ID.TEMPLATE, TAG_ID.HTML]);
    TABLE_BODY_CONTEXT = /* @__PURE__ */ new Set([TAG_ID.TBODY, TAG_ID.TFOOT, TAG_ID.THEAD, TAG_ID.TEMPLATE, TAG_ID.HTML]);
    TABLE_CONTEXT = /* @__PURE__ */ new Set([TAG_ID.TABLE, TAG_ID.TEMPLATE, TAG_ID.HTML]);
    TABLE_CELLS = /* @__PURE__ */ new Set([TAG_ID.TD, TAG_ID.TH]);
  }
});

// node_modules/parse5/dist/parser/formatting-element-list.js
var EntryType, MARKER;
var init_formatting_element_list = __esm({
  "node_modules/parse5/dist/parser/formatting-element-list.js"() {
    "use strict";
    (function(EntryType2) {
      EntryType2[EntryType2["Marker"] = 0] = "Marker";
      EntryType2[EntryType2["Element"] = 1] = "Element";
    })(EntryType || (EntryType = {}));
    MARKER = { type: EntryType.Marker };
  }
});

// node_modules/parse5/dist/tree-adapters/default.js
var init_default = __esm({
  "node_modules/parse5/dist/tree-adapters/default.js"() {
    "use strict";
    init_html();
  }
});

// node_modules/parse5/dist/common/doctype.js
var QUIRKS_MODE_PUBLIC_ID_PREFIXES, QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES, LIMITED_QUIRKS_PUBLIC_ID_PREFIXES, LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES;
var init_doctype = __esm({
  "node_modules/parse5/dist/common/doctype.js"() {
    "use strict";
    init_html();
    QUIRKS_MODE_PUBLIC_ID_PREFIXES = [
      "+//silmaril//dtd html pro v0r11 19970101//",
      "-//as//dtd html 3.0 aswedit + extensions//",
      "-//advasoft ltd//dtd html 3.0 aswedit + extensions//",
      "-//ietf//dtd html 2.0 level 1//",
      "-//ietf//dtd html 2.0 level 2//",
      "-//ietf//dtd html 2.0 strict level 1//",
      "-//ietf//dtd html 2.0 strict level 2//",
      "-//ietf//dtd html 2.0 strict//",
      "-//ietf//dtd html 2.0//",
      "-//ietf//dtd html 2.1e//",
      "-//ietf//dtd html 3.0//",
      "-//ietf//dtd html 3.2 final//",
      "-//ietf//dtd html 3.2//",
      "-//ietf//dtd html 3//",
      "-//ietf//dtd html level 0//",
      "-//ietf//dtd html level 1//",
      "-//ietf//dtd html level 2//",
      "-//ietf//dtd html level 3//",
      "-//ietf//dtd html strict level 0//",
      "-//ietf//dtd html strict level 1//",
      "-//ietf//dtd html strict level 2//",
      "-//ietf//dtd html strict level 3//",
      "-//ietf//dtd html strict//",
      "-//ietf//dtd html//",
      "-//metrius//dtd metrius presentational//",
      "-//microsoft//dtd internet explorer 2.0 html strict//",
      "-//microsoft//dtd internet explorer 2.0 html//",
      "-//microsoft//dtd internet explorer 2.0 tables//",
      "-//microsoft//dtd internet explorer 3.0 html strict//",
      "-//microsoft//dtd internet explorer 3.0 html//",
      "-//microsoft//dtd internet explorer 3.0 tables//",
      "-//netscape comm. corp.//dtd html//",
      "-//netscape comm. corp.//dtd strict html//",
      "-//o'reilly and associates//dtd html 2.0//",
      "-//o'reilly and associates//dtd html extended 1.0//",
      "-//o'reilly and associates//dtd html extended relaxed 1.0//",
      "-//sq//dtd html 2.0 hotmetal + extensions//",
      "-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//",
      "-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//",
      "-//spyglass//dtd html 2.0 extended//",
      "-//sun microsystems corp.//dtd hotjava html//",
      "-//sun microsystems corp.//dtd hotjava strict html//",
      "-//w3c//dtd html 3 1995-03-24//",
      "-//w3c//dtd html 3.2 draft//",
      "-//w3c//dtd html 3.2 final//",
      "-//w3c//dtd html 3.2//",
      "-//w3c//dtd html 3.2s draft//",
      "-//w3c//dtd html 4.0 frameset//",
      "-//w3c//dtd html 4.0 transitional//",
      "-//w3c//dtd html experimental 19960712//",
      "-//w3c//dtd html experimental 970421//",
      "-//w3c//dtd w3 html//",
      "-//w3o//dtd w3 html 3.0//",
      "-//webtechs//dtd mozilla html 2.0//",
      "-//webtechs//dtd mozilla html//"
    ];
    QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
      ...QUIRKS_MODE_PUBLIC_ID_PREFIXES,
      "-//w3c//dtd html 4.01 frameset//",
      "-//w3c//dtd html 4.01 transitional//"
    ];
    LIMITED_QUIRKS_PUBLIC_ID_PREFIXES = ["-//w3c//dtd xhtml 1.0 frameset//", "-//w3c//dtd xhtml 1.0 transitional//"];
    LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
      ...LIMITED_QUIRKS_PUBLIC_ID_PREFIXES,
      "-//w3c//dtd html 4.01 frameset//",
      "-//w3c//dtd html 4.01 transitional//"
    ];
  }
});

// node_modules/parse5/dist/common/foreign-content.js
var SVG_ATTRS_ADJUSTMENT_MAP, XML_ATTRS_ADJUSTMENT_MAP, SVG_TAG_NAMES_ADJUSTMENT_MAP, EXITS_FOREIGN_CONTENT;
var init_foreign_content = __esm({
  "node_modules/parse5/dist/common/foreign-content.js"() {
    "use strict";
    init_html();
    SVG_ATTRS_ADJUSTMENT_MAP = new Map([
      "attributeName",
      "attributeType",
      "baseFrequency",
      "baseProfile",
      "calcMode",
      "clipPathUnits",
      "diffuseConstant",
      "edgeMode",
      "filterUnits",
      "glyphRef",
      "gradientTransform",
      "gradientUnits",
      "kernelMatrix",
      "kernelUnitLength",
      "keyPoints",
      "keySplines",
      "keyTimes",
      "lengthAdjust",
      "limitingConeAngle",
      "markerHeight",
      "markerUnits",
      "markerWidth",
      "maskContentUnits",
      "maskUnits",
      "numOctaves",
      "pathLength",
      "patternContentUnits",
      "patternTransform",
      "patternUnits",
      "pointsAtX",
      "pointsAtY",
      "pointsAtZ",
      "preserveAlpha",
      "preserveAspectRatio",
      "primitiveUnits",
      "refX",
      "refY",
      "repeatCount",
      "repeatDur",
      "requiredExtensions",
      "requiredFeatures",
      "specularConstant",
      "specularExponent",
      "spreadMethod",
      "startOffset",
      "stdDeviation",
      "stitchTiles",
      "surfaceScale",
      "systemLanguage",
      "tableValues",
      "targetX",
      "targetY",
      "textLength",
      "viewBox",
      "viewTarget",
      "xChannelSelector",
      "yChannelSelector",
      "zoomAndPan"
    ].map((attr) => [attr.toLowerCase(), attr]));
    XML_ATTRS_ADJUSTMENT_MAP = /* @__PURE__ */ new Map([
      ["xlink:actuate", { prefix: "xlink", name: "actuate", namespace: NS.XLINK }],
      ["xlink:arcrole", { prefix: "xlink", name: "arcrole", namespace: NS.XLINK }],
      ["xlink:href", { prefix: "xlink", name: "href", namespace: NS.XLINK }],
      ["xlink:role", { prefix: "xlink", name: "role", namespace: NS.XLINK }],
      ["xlink:show", { prefix: "xlink", name: "show", namespace: NS.XLINK }],
      ["xlink:title", { prefix: "xlink", name: "title", namespace: NS.XLINK }],
      ["xlink:type", { prefix: "xlink", name: "type", namespace: NS.XLINK }],
      ["xml:lang", { prefix: "xml", name: "lang", namespace: NS.XML }],
      ["xml:space", { prefix: "xml", name: "space", namespace: NS.XML }],
      ["xmlns", { prefix: "", name: "xmlns", namespace: NS.XMLNS }],
      ["xmlns:xlink", { prefix: "xmlns", name: "xlink", namespace: NS.XMLNS }]
    ]);
    SVG_TAG_NAMES_ADJUSTMENT_MAP = new Map([
      "altGlyph",
      "altGlyphDef",
      "altGlyphItem",
      "animateColor",
      "animateMotion",
      "animateTransform",
      "clipPath",
      "feBlend",
      "feColorMatrix",
      "feComponentTransfer",
      "feComposite",
      "feConvolveMatrix",
      "feDiffuseLighting",
      "feDisplacementMap",
      "feDistantLight",
      "feFlood",
      "feFuncA",
      "feFuncB",
      "feFuncG",
      "feFuncR",
      "feGaussianBlur",
      "feImage",
      "feMerge",
      "feMergeNode",
      "feMorphology",
      "feOffset",
      "fePointLight",
      "feSpecularLighting",
      "feSpotLight",
      "feTile",
      "feTurbulence",
      "foreignObject",
      "glyphRef",
      "linearGradient",
      "radialGradient",
      "textPath"
    ].map((tn) => [tn.toLowerCase(), tn]));
    EXITS_FOREIGN_CONTENT = /* @__PURE__ */ new Set([
      TAG_ID.B,
      TAG_ID.BIG,
      TAG_ID.BLOCKQUOTE,
      TAG_ID.BODY,
      TAG_ID.BR,
      TAG_ID.CENTER,
      TAG_ID.CODE,
      TAG_ID.DD,
      TAG_ID.DIV,
      TAG_ID.DL,
      TAG_ID.DT,
      TAG_ID.EM,
      TAG_ID.EMBED,
      TAG_ID.H1,
      TAG_ID.H2,
      TAG_ID.H3,
      TAG_ID.H4,
      TAG_ID.H5,
      TAG_ID.H6,
      TAG_ID.HEAD,
      TAG_ID.HR,
      TAG_ID.I,
      TAG_ID.IMG,
      TAG_ID.LI,
      TAG_ID.LISTING,
      TAG_ID.MENU,
      TAG_ID.META,
      TAG_ID.NOBR,
      TAG_ID.OL,
      TAG_ID.P,
      TAG_ID.PRE,
      TAG_ID.RUBY,
      TAG_ID.S,
      TAG_ID.SMALL,
      TAG_ID.SPAN,
      TAG_ID.STRONG,
      TAG_ID.STRIKE,
      TAG_ID.SUB,
      TAG_ID.SUP,
      TAG_ID.TABLE,
      TAG_ID.TT,
      TAG_ID.U,
      TAG_ID.UL,
      TAG_ID.VAR
    ]);
  }
});

// node_modules/parse5/dist/parser/index.js
var InsertionMode, TABLE_STRUCTURE_TAGS, TABLE_VOID_ELEMENTS;
var init_parser = __esm({
  "node_modules/parse5/dist/parser/index.js"() {
    "use strict";
    init_tokenizer();
    init_open_element_stack();
    init_formatting_element_list();
    init_default();
    init_doctype();
    init_foreign_content();
    init_error_codes();
    init_unicode();
    init_html();
    init_token();
    (function(InsertionMode2) {
      InsertionMode2[InsertionMode2["INITIAL"] = 0] = "INITIAL";
      InsertionMode2[InsertionMode2["BEFORE_HTML"] = 1] = "BEFORE_HTML";
      InsertionMode2[InsertionMode2["BEFORE_HEAD"] = 2] = "BEFORE_HEAD";
      InsertionMode2[InsertionMode2["IN_HEAD"] = 3] = "IN_HEAD";
      InsertionMode2[InsertionMode2["IN_HEAD_NO_SCRIPT"] = 4] = "IN_HEAD_NO_SCRIPT";
      InsertionMode2[InsertionMode2["AFTER_HEAD"] = 5] = "AFTER_HEAD";
      InsertionMode2[InsertionMode2["IN_BODY"] = 6] = "IN_BODY";
      InsertionMode2[InsertionMode2["TEXT"] = 7] = "TEXT";
      InsertionMode2[InsertionMode2["IN_TABLE"] = 8] = "IN_TABLE";
      InsertionMode2[InsertionMode2["IN_TABLE_TEXT"] = 9] = "IN_TABLE_TEXT";
      InsertionMode2[InsertionMode2["IN_CAPTION"] = 10] = "IN_CAPTION";
      InsertionMode2[InsertionMode2["IN_COLUMN_GROUP"] = 11] = "IN_COLUMN_GROUP";
      InsertionMode2[InsertionMode2["IN_TABLE_BODY"] = 12] = "IN_TABLE_BODY";
      InsertionMode2[InsertionMode2["IN_ROW"] = 13] = "IN_ROW";
      InsertionMode2[InsertionMode2["IN_CELL"] = 14] = "IN_CELL";
      InsertionMode2[InsertionMode2["IN_SELECT"] = 15] = "IN_SELECT";
      InsertionMode2[InsertionMode2["IN_SELECT_IN_TABLE"] = 16] = "IN_SELECT_IN_TABLE";
      InsertionMode2[InsertionMode2["IN_TEMPLATE"] = 17] = "IN_TEMPLATE";
      InsertionMode2[InsertionMode2["AFTER_BODY"] = 18] = "AFTER_BODY";
      InsertionMode2[InsertionMode2["IN_FRAMESET"] = 19] = "IN_FRAMESET";
      InsertionMode2[InsertionMode2["AFTER_FRAMESET"] = 20] = "AFTER_FRAMESET";
      InsertionMode2[InsertionMode2["AFTER_AFTER_BODY"] = 21] = "AFTER_AFTER_BODY";
      InsertionMode2[InsertionMode2["AFTER_AFTER_FRAMESET"] = 22] = "AFTER_AFTER_FRAMESET";
    })(InsertionMode || (InsertionMode = {}));
    TABLE_STRUCTURE_TAGS = /* @__PURE__ */ new Set([TAG_ID.TABLE, TAG_ID.TBODY, TAG_ID.TFOOT, TAG_ID.THEAD, TAG_ID.TR]);
    TABLE_VOID_ELEMENTS = /* @__PURE__ */ new Set([TAG_ID.CAPTION, TAG_ID.COL, TAG_ID.COLGROUP, TAG_ID.TBODY, TAG_ID.TD, TAG_ID.TFOOT, TAG_ID.TH, TAG_ID.THEAD, TAG_ID.TR]);
  }
});

// node_modules/entities/dist/esm/escape.js
var getCodePoint;
var init_escape = __esm({
  "node_modules/entities/dist/esm/escape.js"() {
    "use strict";
    getCodePoint = // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.prototype.codePointAt == null ? (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index) : (
      // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      (input, index) => input.codePointAt(index)
    );
  }
});

// node_modules/parse5/dist/serializer/index.js
var VOID_ELEMENTS;
var init_serializer = __esm({
  "node_modules/parse5/dist/serializer/index.js"() {
    "use strict";
    init_html();
    init_escape();
    init_default();
    VOID_ELEMENTS = /* @__PURE__ */ new Set([
      TAG_NAMES.AREA,
      TAG_NAMES.BASE,
      TAG_NAMES.BASEFONT,
      TAG_NAMES.BGSOUND,
      TAG_NAMES.BR,
      TAG_NAMES.COL,
      TAG_NAMES.EMBED,
      TAG_NAMES.FRAME,
      TAG_NAMES.HR,
      TAG_NAMES.IMG,
      TAG_NAMES.INPUT,
      TAG_NAMES.KEYGEN,
      TAG_NAMES.LINK,
      TAG_NAMES.META,
      TAG_NAMES.PARAM,
      TAG_NAMES.SOURCE,
      TAG_NAMES.TRACK,
      TAG_NAMES.WBR
    ]);
  }
});

// node_modules/parse5/dist/index.js
var init_dist = __esm({
  "node_modules/parse5/dist/index.js"() {
    "use strict";
    init_parser();
    init_default();
    init_parser();
    init_serializer();
    init_error_codes();
    init_foreign_content();
    init_html();
    init_token();
    init_tokenizer();
  }
});

// node_modules/@formepdf/shared/dist/encode.js
var init_encode = __esm({
  "node_modules/@formepdf/shared/dist/encode.js"() {
    "use strict";
  }
});

// node_modules/@formepdf/shared/dist/parser.js
var init_parser2 = __esm({
  "node_modules/@formepdf/shared/dist/parser.js"() {
    "use strict";
    init_dist();
    init_dist2();
    init_encode();
  }
});

// node_modules/@formepdf/shared/dist/index.js
var init_dist2 = __esm({
  "node_modules/@formepdf/shared/dist/index.js"() {
    "use strict";
    init_style();
    init_font();
    init_canvas();
    init_semantics();
    init_charts2();
    init_parser2();
    init_encode();
  }
});

// node_modules/@formepdf/react/dist/font.js
var init_font2 = __esm({
  "node_modules/@formepdf/react/dist/font.js"() {
    "use strict";
    init_dist2();
  }
});

// node_modules/@formepdf/react/dist/template-proxy.js
var init_template_proxy = __esm({
  "node_modules/@formepdf/react/dist/template-proxy.js"() {
    "use strict";
  }
});

// node_modules/@formepdf/react/dist/serialize.js
function validateNesting(componentName, parent) {
  const rule = VALID_PARENTS[componentName];
  if (!rule)
    return;
  if (parent !== null && !rule.allowed.includes(parent)) {
    throw new Error(`Invalid nesting: <${componentName}> found inside <${parent}>. ${rule.suggestion}`);
  }
}
function extractSourceLocation(element) {
  const map = globalThis.__formeSourceMap;
  if (map) {
    const source = map.get(element);
    if (source)
      return source;
  }
  const s = element._source;
  if (s && s.fileName) {
    return { file: s.fileName, line: s.lineNumber, column: s.columnNumber };
  }
  return void 0;
}
function isDocumentType(type) {
  if (type === Document)
    return true;
  if (typeof type === "function") {
    return type.__formeType === "Document" || type.displayName === "Document" || type.name === "Document";
  }
  return false;
}
function resolveElement(element) {
  let resolved = element;
  for (let i = 0; i < 10 && typeof resolved.type === "function" && !isDocumentType(resolved.type); i++) {
    const result = callComponent(resolved.type, resolved.props);
    if (!(0, import_react2.isValidElement)(result))
      break;
    resolved = result;
  }
  return resolved;
}
function callComponent(fn, props) {
  try {
    return fn(props);
  } catch (err) {
    if (err instanceof Error && /hook|useMemoCache|Invalid hook call/i.test(err.message)) {
      const name = fn.displayName || fn.name || "Unknown";
      throw new Error(`Component "${name}" appears to be compiled by React Compiler, which injects hooks that cannot run outside of React's render cycle. Forme's serialize() calls components directly to walk the element tree.

Fix: Add 'use no memo' at the top of the component to opt it out of React Compiler:

  function ${name}(props) {
    'use no memo';
    return <Document>...</Document>;
  }

Alternatively, call the component yourself before passing to renderDocument():

  const element = <${name} data={data} />;
  // becomes:
  const element = ${name}({ data });
  await renderDocument(element);`);
    }
    throw err;
  }
}
function serialize2(element) {
  element = resolveElement(element);
  if (!isDocumentType(element.type)) {
    throw new Error("Top-level element must be <Document>");
  }
  const props = element.props;
  const childElements = flattenChildren(props.children);
  const pageNodes = [];
  const contentNodes = [];
  for (const child of childElements) {
    if ((0, import_react2.isValidElement)(child) && child.type === Page) {
      pageNodes.push(serializePage(child));
    } else {
      const node = serializeChild(child, "Document");
      if (node)
        contentNodes.push(node);
    }
  }
  let children;
  if (pageNodes.length > 0) {
    if (contentNodes.length > 0) {
      const lastPage = pageNodes[pageNodes.length - 1];
      lastPage.children.push(...contentNodes);
    }
    children = pageNodes;
  } else if (contentNodes.length > 0) {
    children = contentNodes;
  } else {
    children = [];
  }
  const metadata = {};
  if (props.title !== void 0)
    metadata.title = props.title;
  if (props.author !== void 0)
    metadata.author = props.author;
  if (props.subject !== void 0)
    metadata.subject = props.subject;
  if (props.creator !== void 0)
    metadata.creator = props.creator;
  if (props.lang !== void 0)
    metadata.lang = props.lang;
  const mergedFonts = mergeFonts(Font.getRegistered(), props.fonts);
  const result = {
    children,
    metadata,
    defaultPage: {
      size: "A4",
      margin: { top: 54, right: 54, bottom: 54, left: 54 },
      wrap: true
    }
  };
  if (props.style)
    result.defaultStyle = mapStyle(props.style);
  if (props.tagged !== void 0)
    result.tagged = props.tagged;
  if (props.pdfa !== void 0)
    result.pdfa = props.pdfa;
  if (props.pdfVersion !== void 0)
    result.pdfVersion = props.pdfVersion;
  if (props.pdfUa)
    result.pdfUa = true;
  if (props.pdfUa2)
    result.pdfUa2 = true;
  const cert = props.certification ?? props.signature;
  if (cert) {
    if (props.signature && !props.certification) {
      console.warn("[Forme] The `signature` prop is deprecated. Use `certification` instead.");
    }
    result.certification = cert;
  }
  if (mergedFonts.length > 0) {
    result.fonts = mergedFonts;
  }
  return result;
}
function serializePage(element) {
  const props = element.props;
  let size = "A4";
  if (props.size !== void 0) {
    if (typeof props.size === "string") {
      size = props.size;
    } else {
      size = { Custom: { width: props.size.width, height: props.size.height } };
    }
  }
  let margin = { top: 54, right: 54, bottom: 54, left: 54 };
  if (props.margin !== void 0) {
    margin = expandEdges(props.margin);
  }
  const config = { size, margin, wrap: true };
  if (props.backgroundImage !== void 0)
    config.backgroundImage = props.backgroundImage;
  if (props.backgroundOpacity !== void 0)
    config.backgroundOpacity = props.backgroundOpacity;
  if (props.backgroundSize !== void 0)
    config.backgroundSize = props.backgroundSize;
  if (props.backgroundPosition !== void 0)
    config.backgroundPosition = props.backgroundPosition;
  const childElements = flattenChildren(props.children);
  const children = serializeChildren(childElements, "Page");
  return {
    kind: { type: "Page", config },
    style: props.style ? mapStyle(props.style) : {},
    children,
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeChild(child, parent = null) {
  if (child === null || child === void 0 || typeof child === "boolean") {
    return null;
  }
  if (typeof child === "string") {
    return {
      kind: { type: "Text", content: child },
      style: {},
      children: []
    };
  }
  if (typeof child === "number") {
    return {
      kind: { type: "Text", content: String(child) },
      style: {},
      children: []
    };
  }
  if (!(0, import_react2.isValidElement)(child)) {
    if (typeof child === "object" && child !== null && "type" in child) {
      const t = child.type;
      if (typeof t === "string") {
        const suggestions = {
          div: "View",
          span: "Text",
          p: "Text",
          h1: "Text",
          h2: "Text",
          h3: "Text",
          img: "Image",
          table: "Table",
          tr: "Row",
          td: "Cell"
        };
        const suggestion = suggestions[t];
        if (suggestion) {
          throw new Error(`HTML element <${t}> is not supported. Use <${suggestion}> instead.`);
        }
      }
    }
    return null;
  }
  const element = child;
  if (element.type === View) {
    return serializeView(element, parent);
  }
  if (element.type === Text) {
    return serializeText(element);
  }
  if (element.type === H1)
    return serializeHeading(element, 1);
  if (element.type === H2)
    return serializeHeading(element, 2);
  if (element.type === H3)
    return serializeHeading(element, 3);
  if (element.type === H4)
    return serializeHeading(element, 4);
  if (element.type === H5)
    return serializeHeading(element, 5);
  if (element.type === H6)
    return serializeHeading(element, 6);
  if (element.type === OrderedList)
    return serializeList(element, true);
  if (element.type === UnorderedList)
    return serializeList(element, false);
  if (element.type === ListItem)
    return serializeListItem(element);
  if (element.type === Image) {
    return serializeImage(element);
  }
  if (element.type === Table) {
    return serializeTable(element, parent);
  }
  if (element.type === Row) {
    validateNesting("Row", parent);
    return serializeRow(element);
  }
  if (element.type === Cell) {
    validateNesting("Cell", parent);
    return serializeCell(element);
  }
  if (element.type === Fixed) {
    return serializeFixed(element);
  }
  if (element.type === Svg) {
    return serializeSvg(element);
  }
  if (element.type === QrCode) {
    return serializeQrCode(element);
  }
  if (element.type === Barcode) {
    return serializeBarcode(element);
  }
  if (element.type === TextField) {
    return serializeTextField(element);
  }
  if (element.type === Checkbox) {
    return serializeCheckbox(element);
  }
  if (element.type === Dropdown) {
    return serializeDropdown(element);
  }
  if (element.type === RadioButton) {
    return serializeRadioButton(element);
  }
  if (element.type === Canvas) {
    return serializeCanvas(element);
  }
  if (element.type === Watermark) {
    return serializeWatermark(element);
  }
  if (element.type === BarChart) {
    return serializeBarChart(element);
  }
  if (element.type === LineChart) {
    return serializeLineChart(element);
  }
  if (element.type === PieChart) {
    return serializePieChart(element);
  }
  if (element.type === AreaChart) {
    return serializeAreaChart(element);
  }
  if (element.type === DotPlot) {
    return serializeDotPlot(element);
  }
  if (element.type === PageBreak) {
    return {
      kind: { type: "PageBreak" },
      style: {},
      children: [],
      sourceLocation: extractSourceLocation(element)
    };
  }
  if (element.type === Page) {
    validateNesting("Page", parent);
    return serializePage(element);
  }
  if (isDocumentType(element.type)) {
    const props = element.props;
    const childElements = flattenChildren(props.children);
    const nodes = serializeChildren(childElements, parent);
    return nodes.length === 1 ? nodes[0] : {
      kind: { type: "View" },
      style: {},
      children: nodes
    };
  }
  if (typeof element.type === "function") {
    const result = callComponent(element.type, element.props);
    if ((0, import_react2.isValidElement)(result)) {
      return serializeChild(result, parent);
    }
    return null;
  }
  return null;
}
function serializeView(element, _parent = null) {
  const props = element.props;
  const style = mapStyle(props.style);
  if (props.wrap !== void 0) {
    style.wrap = props.wrap;
  }
  const childElements = flattenChildren(props.children);
  const children = serializeChildren(childElements, "View");
  const node = {
    kind: { type: "View" },
    style,
    children,
    sourceLocation: extractSourceLocation(element)
  };
  if (props.bookmark)
    node.bookmark = props.bookmark;
  if (props.href)
    node.href = props.href;
  return node;
}
function inlineDefaults(type) {
  switch (type) {
    case Text:
      return {};
    case Strong:
      return STRONG_DEFAULTS;
    case Em:
      return EM_DEFAULTS;
    case Code:
      return CODE_DEFAULTS;
    case Link:
      return LINK_DEFAULTS;
    default:
      return null;
  }
}
function buildTextRuns(children, accStyle = {}, accHref = void 0) {
  const out = [];
  const elements = flattenChildren(children);
  for (const child of elements) {
    if (child === null || child === void 0 || typeof child === "boolean")
      continue;
    if (typeof child === "string" || typeof child === "number") {
      const content = String(child);
      if (content === "")
        continue;
      const run = { content };
      if (Object.keys(accStyle).length > 0)
        run.style = mapStyle(accStyle);
      if (accHref)
        run.href = accHref;
      out.push(run);
      continue;
    }
    if (!(0, import_react2.isValidElement)(child))
      continue;
    const defaults = inlineDefaults(child.type);
    if (defaults === null)
      continue;
    const childProps = child.props;
    const nextStyle = { ...accStyle, ...defaults, ...childProps.style || {} };
    const nextHref = childProps.href ?? accHref;
    out.push(...buildTextRuns(childProps.children, nextStyle, nextHref));
  }
  return out;
}
function serializeText(element) {
  const props = element.props;
  const childElements = flattenChildren(props.children);
  const hasInlineChild = childElements.some((c) => (0, import_react2.isValidElement)(c) && inlineDefaults(c.type) !== null);
  const kind = { type: "Text", content: "" };
  if (hasInlineChild) {
    kind.runs = buildTextRuns(props.children);
  } else {
    kind.content = flattenTextContent(props.children);
  }
  if (props.href)
    kind.href = props.href;
  const node = {
    kind,
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
  if (props.bookmark)
    node.bookmark = props.bookmark;
  return node;
}
function buildHeading(element, level, ctx) {
  const props = element.props;
  const childElements = ctx.flatten(props.children);
  const hasRunChild = childElements.some((c) => (0, import_react2.isValidElement)(c) && ctx.isRunChild(c));
  const kind = { type: "Heading", level, content: "" };
  if (hasRunChild) {
    kind.runs = ctx.buildRuns(props.children);
  } else {
    kind.content = ctx.textContent(props.children);
  }
  if (props.href)
    kind.href = props.href;
  const mergedStyle = { ...HEADING_DEFAULTS[level], ...props.style || {} };
  const node = {
    kind,
    style: ctx.style(mergedStyle),
    children: []
  };
  const loc = ctx.sourceLocation(element);
  if (loc !== void 0)
    node.sourceLocation = loc;
  if (props.bookmark)
    node.bookmark = props.bookmark;
  return node;
}
function buildList(element, ordered, ctx) {
  const props = element.props;
  const markerType = ordered ? mapListMarker(props.type, "decimal") : mapListMarker(props.marker, "disc");
  const start = typeof props.start === "number" && props.start >= 1 ? props.start : 1;
  const childElements = ctx.flatten(props.children).filter((c) => (0, import_react2.isValidElement)(c) && c.type === ListItem);
  const children = childElements.map((c) => buildListItem(c, ctx));
  const node = {
    kind: { type: "List", ordered, marker_type: markerType, start },
    style: ctx.style(props.style),
    children
  };
  const loc = ctx.sourceLocation(element);
  if (loc !== void 0)
    node.sourceLocation = loc;
  if (props.bookmark)
    node.bookmark = props.bookmark;
  return node;
}
function buildListItem(element, ctx) {
  const props = element.props;
  const rawChildren = ctx.flatten(props.children);
  const children = [];
  for (const c of rawChildren) {
    if (typeof c === "string" || typeof c === "number") {
      children.push({
        kind: { type: "Text", content: ctx.textContent(c) },
        style: {},
        children: []
      });
    } else if ((0, import_react2.isValidElement)(c)) {
      const node2 = ctx.child(c, null);
      if (node2)
        children.push(node2);
    }
  }
  const node = {
    kind: { type: "ListItem" },
    style: ctx.style(props.style),
    children
  };
  const loc = ctx.sourceLocation(element);
  if (loc !== void 0)
    node.sourceLocation = loc;
  return node;
}
function serializeHeading(element, level) {
  return buildHeading(element, level, MAIN_CTX);
}
function serializeList(element, ordered) {
  return buildList(element, ordered, MAIN_CTX);
}
function serializeListItem(element) {
  return buildListItem(element, MAIN_CTX);
}
function serializeImage(element) {
  const props = element.props;
  const kind = { type: "Image", src: props.src };
  if (props.width !== void 0)
    kind.width = props.width;
  if (props.height !== void 0)
    kind.height = props.height;
  const node = {
    kind,
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
  if (props.href)
    node.href = props.href;
  if (props.alt)
    node.alt = props.alt;
  return node;
}
function serializeTable(element, _parent = null) {
  const props = element.props;
  const columns = (props.columns ?? []).map((col) => ({
    width: mapColumnWidth(col.width)
  }));
  const childElements = flattenChildren(props.children);
  const children = serializeChildren(childElements, "Table");
  return {
    kind: { type: "Table", columns },
    style: mapStyle(props.style),
    children,
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeRow(element) {
  const props = element.props;
  const childElements = flattenChildren(props.children);
  const children = serializeChildren(childElements, "Row");
  return {
    kind: { type: "TableRow", is_header: props.header ?? false },
    style: mapStyle(props.style),
    children,
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeCell(element) {
  const props = element.props;
  const childElements = flattenChildren(props.children);
  const children = serializeChildren(childElements, "Cell");
  return {
    kind: { type: "TableCell", col_span: props.colSpan ?? 1, row_span: props.rowSpan ?? 1 },
    style: mapStyle(props.style),
    children,
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeFixed(element) {
  const props = element.props;
  const position = props.position === "header" ? "Header" : "Footer";
  const childElements = flattenChildren(props.children);
  const children = serializeChildren(childElements, "Fixed");
  const node = {
    kind: { type: "Fixed", position },
    style: mapStyle(props.style),
    children,
    sourceLocation: extractSourceLocation(element)
  };
  if (props.bookmark)
    node.bookmark = props.bookmark;
  return node;
}
function serializeSvg(element) {
  const props = element.props;
  const content = props.content ?? (props.children ? svgChildrenToString(props.children) : "");
  const kind = {
    type: "Svg",
    width: props.width,
    height: props.height,
    content
  };
  if (props.viewBox)
    kind.view_box = props.viewBox;
  const node = {
    kind,
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
  if (props.href)
    node.href = props.href;
  if (props.alt)
    node.alt = props.alt;
  return node;
}
function escapeXmlAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function svgChildrenToString(children) {
  let result = "";
  import_react2.Children.forEach(children, (child) => {
    if (typeof child === "string") {
      result += child.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return;
    }
    if (!(0, import_react2.isValidElement)(child))
      return;
    const tag = typeof child.type === "string" ? child.type : null;
    if (!tag)
      return;
    const { children: nested, ...attrs } = child.props;
    const attrStr = Object.entries(attrs).filter(([, v]) => v !== void 0 && v !== null).map(([k, v]) => {
      const name = svgCamelToKebab[k] ?? k;
      return `${name}="${escapeXmlAttr(String(v))}"`;
    }).join(" ");
    const open4 = attrStr ? `<${tag} ${attrStr}` : `<${tag}`;
    if (nested) {
      result += `${open4}>${svgChildrenToString(nested)}</${tag}>`;
    } else {
      result += `${open4}/>`;
    }
  });
  return result;
}
function serializeQrCode(element) {
  const props = element.props;
  const kind = { type: "QrCode", data: props.data };
  if (props.size !== void 0)
    kind.size = props.size;
  const style = mapStyle(props.style);
  if (props.color)
    style.color = parseColor(props.color);
  return {
    kind,
    style,
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeBarcode(element) {
  const props = element.props;
  const kind = {
    type: "Barcode",
    data: props.data,
    format: props.format ?? "Code128",
    height: props.height ?? 60
  };
  if (props.width !== void 0)
    kind.width = props.width;
  const style = mapStyle(props.style);
  if (props.color)
    style.color = parseColor(props.color);
  return {
    kind,
    style,
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeTextField(element) {
  const props = element.props;
  const kind = {
    type: "TextField",
    name: props.name,
    width: props.width,
    height: props.height ?? 24,
    multiline: props.multiline ?? false,
    password: props.password ?? false,
    read_only: props.readOnly ?? false,
    font_size: props.fontSize ?? 12
  };
  if (props.value !== void 0)
    kind.value = props.value;
  if (props.placeholder !== void 0)
    kind.placeholder = props.placeholder;
  if (props.maxLength !== void 0)
    kind.max_length = props.maxLength;
  return {
    kind,
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeCheckbox(element) {
  const props = element.props;
  const kind = {
    type: "Checkbox",
    name: props.name,
    checked: props.checked ?? false,
    width: props.width ?? 14,
    height: props.height ?? 14,
    read_only: props.readOnly ?? false
  };
  return {
    kind,
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeDropdown(element) {
  const props = element.props;
  const kind = {
    type: "Dropdown",
    name: props.name,
    options: props.options,
    width: props.width,
    height: props.height ?? 24,
    read_only: props.readOnly ?? false,
    font_size: props.fontSize ?? 12
  };
  if (props.value !== void 0)
    kind.value = props.value;
  return {
    kind,
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeRadioButton(element) {
  const props = element.props;
  const kind = {
    type: "RadioButton",
    name: props.name,
    value: props.value,
    checked: props.checked ?? false,
    width: props.width ?? 14,
    height: props.height ?? 14,
    read_only: props.readOnly ?? false
  };
  return {
    kind,
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeCanvas(element) {
  const props = element.props;
  const operations = recordCanvasOperations(props.draw);
  return {
    kind: { type: "Canvas", width: props.width, height: props.height, operations },
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeWatermark(element) {
  const props = element.props;
  const fontSize = props.fontSize ?? 60;
  const angle = props.angle ?? -45;
  const colorStr = props.color ?? "rgba(0,0,0,0.1)";
  const parsedColor = parseColor(colorStr);
  const style = mapStyle(props.style);
  style.color = { r: parsedColor.r, g: parsedColor.g, b: parsedColor.b, a: 1 };
  const colorOpacity = parsedColor.a;
  const styleOpacity = style.opacity !== void 0 ? style.opacity : 1;
  style.opacity = colorOpacity * styleOpacity;
  style.fontSize = fontSize;
  return {
    kind: { type: "Watermark", text: props.text, font_size: fontSize, angle },
    style,
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeBarChart(element) {
  const props = element.props;
  return {
    kind: buildBarChartKind(props),
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeLineChart(element) {
  const props = element.props;
  return {
    kind: buildLineChartKind(props),
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializePieChart(element) {
  const props = element.props;
  return {
    kind: buildPieChartKind(props),
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeAreaChart(element) {
  const props = element.props;
  return {
    kind: buildAreaChartKind(props),
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function serializeDotPlot(element) {
  const props = element.props;
  return {
    kind: buildDotPlotKind(props),
    style: mapStyle(props.style),
    children: [],
    sourceLocation: extractSourceLocation(element)
  };
}
function flattenChildren(children) {
  const result = [];
  import_react2.Children.forEach(children, (child) => {
    if (Array.isArray(child)) {
      result.push(...child.flatMap((c) => flattenChildren(c)));
    } else if ((0, import_react2.isValidElement)(child) && child.type === import_react2.Fragment) {
      const fragProps = child.props;
      result.push(...flattenChildren(fragProps.children));
    } else {
      result.push(child);
    }
  });
  return result;
}
function serializeChildren(children, parent = null) {
  const nodes = [];
  for (const child of children) {
    const node = serializeChild(child, parent);
    if (node)
      nodes.push(node);
  }
  return nodes;
}
function flattenTextContent(children) {
  if (children === null || children === void 0)
    return "";
  if (typeof children === "string")
    return children;
  if (typeof children === "number")
    return String(children);
  if (typeof children === "boolean")
    return "";
  if (Array.isArray(children)) {
    return children.map((c) => flattenTextContent(c)).join("");
  }
  if ((0, import_react2.isValidElement)(children)) {
    const element = children;
    if (element.type === Text) {
      const props2 = element.props;
      return flattenTextContent(props2.children);
    }
    const props = element.props;
    return flattenTextContent(props.children);
  }
  const arr = [];
  import_react2.Children.forEach(children, (c) => arr.push(c));
  if (arr.length > 0) {
    return arr.map((c) => flattenTextContent(c)).join("");
  }
  return String(children);
}
var import_react2, VALID_PARENTS, MAIN_CTX, svgCamelToKebab;
var init_serialize = __esm({
  "node_modules/@formepdf/react/dist/serialize.js"() {
    "use strict";
    import_react2 = __toESM(require_react(), 1);
    init_components();
    init_font2();
    init_dist2();
    init_template_proxy();
    VALID_PARENTS = {
      Page: {
        allowed: ["Document"],
        suggestion: "<Page> must be a direct child of <Document>."
      },
      Row: {
        allowed: ["Table"],
        suggestion: "<Row> must be inside a <Table>. Wrap it: <Table><Row>...</Row></Table>"
      },
      Cell: {
        allowed: ["Row"],
        suggestion: "<Cell> must be inside a <Row>. Wrap it: <Row><Cell>...</Cell></Row>"
      }
    };
    MAIN_CTX = {
      flatten: (c) => flattenChildren(c),
      style: (s) => mapStyle(s),
      textContent: (c) => flattenTextContent(c),
      isRunChild: (c) => inlineDefaults(c.type) !== null,
      buildRuns: (c) => buildTextRuns(c),
      child: (c, parent) => serializeChild(c, parent),
      sourceLocation: (e) => extractSourceLocation(e)
    };
    svgCamelToKebab = {
      strokeWidth: "stroke-width",
      strokeLinecap: "stroke-linecap",
      strokeLinejoin: "stroke-linejoin",
      strokeMiterlimit: "stroke-miterlimit",
      strokeDasharray: "stroke-dasharray",
      strokeDashoffset: "stroke-dashoffset",
      strokeOpacity: "stroke-opacity",
      fillOpacity: "fill-opacity",
      fillRule: "fill-rule",
      clipPath: "clip-path",
      clipRule: "clip-rule"
    };
  }
});

// node_modules/@formepdf/react/dist/stylesheet.js
var StyleSheet;
var init_stylesheet = __esm({
  "node_modules/@formepdf/react/dist/stylesheet.js"() {
    "use strict";
    StyleSheet = {
      create(styles) {
        return styles;
      }
    };
  }
});

// node_modules/@formepdf/react/dist/expr.js
var init_expr = __esm({
  "node_modules/@formepdf/react/dist/expr.js"() {
    "use strict";
    init_template_proxy();
  }
});

// node_modules/@formepdf/react/dist/render.js
var init_render = __esm({
  "node_modules/@formepdf/react/dist/render.js"() {
    "use strict";
    init_serialize();
  }
});

// node_modules/@formepdf/react/dist/index.js
var init_dist3 = __esm({
  "node_modules/@formepdf/react/dist/index.js"() {
    "use strict";
    init_components();
    init_charts();
    init_serialize();
    init_dist2();
    init_stylesheet();
    init_font2();
    init_template_proxy();
    init_expr();
    init_render();
  }
});

// node_modules/@formepdf/core/dist/shared/result.js
var init_result = __esm({
  "node_modules/@formepdf/core/dist/shared/result.js"() {
    "use strict";
  }
});

// node_modules/@formepdf/core/dist/attachments.js
function toBase64(data) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const B = globalThis.Buffer;
  if (B)
    return B.from(bytes).toString("base64");
  let bin = "";
  for (let i = 0; i < bytes.length; i += 32768) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return btoa(bin);
}
function applyAttachmentOptions(doc, options) {
  const attachments = [];
  for (const a of options?.attachments ?? []) {
    attachments.push({
      name: a.name,
      src: toBase64(a.data),
      mimeType: a.mimeType,
      relationship: a.relationship,
      description: a.description,
      modDate: a.modDate
    });
  }
  const fx = options?.facturX;
  if (fx) {
    const filename = fx.filename ?? (fx.profile === "XRECHNUNG" ? "xrechnung.xml" : "factur-x.xml");
    attachments.push({
      name: filename,
      src: toBase64(fx.xml),
      mimeType: "text/xml",
      relationship: fx.relationship,
      modDate: fx.modDate
    });
    doc.zugferd = {
      conformanceLevel: fx.profile,
      documentFileName: filename,
      version: fx.version
    };
  }
  if (attachments.length > 0) {
    doc.attachments = attachments;
  }
}
var init_attachments = __esm({
  "node_modules/@formepdf/core/dist/attachments.js"() {
    "use strict";
  }
});

// node_modules/@formepdf/core/dist/extract.js
var init_extract = __esm({
  "node_modules/@formepdf/core/dist/extract.js"() {
    "use strict";
  }
});

// node_modules/@formepdf/core/dist/index.js
import { render_pdf as wasmRenderPdf } from "./forme.cjs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
function uint8ArrayToBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}
async function resolveFonts(doc) {
  const fonts2 = doc.fonts;
  if (!fonts2?.length)
    return;
  for (const font of fonts2) {
    if (font.src instanceof Uint8Array) {
      font.src = uint8ArrayToBase64(font.src);
    } else if (typeof font.src === "string" && !font.src.startsWith("data:")) {
      const bytes = await readFile(resolve(font.src));
      font.src = uint8ArrayToBase64(new Uint8Array(bytes));
    }
  }
}
async function resolveImages(doc) {
  const children = doc.children;
  if (!children?.length)
    return;
  for (const child of children) {
    await resolveImagesInNode(child);
  }
}
async function resolveImagesInNode(node) {
  const kind = node.kind;
  if (kind?.type === "Image" && typeof kind.src === "string") {
    const src = kind.src;
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const res = await fetch(src);
      if (!res.ok)
        throw new Error(`Failed to fetch image: ${src} (${res.status})`);
      const contentType = res.headers.get("content-type") || "image/png";
      const buf = new Uint8Array(await res.arrayBuffer());
      kind.src = `data:${contentType};base64,${uint8ArrayToBase64(buf)}`;
    }
  }
  const children = node.children;
  if (children?.length) {
    for (const child of children) {
      await resolveImagesInNode(child);
    }
  }
}
async function renderPdf(json) {
  return wasmRenderPdf(json);
}
async function renderSerializedDoc(doc, options) {
  if (options?.embedData !== void 0) {
    doc.embeddedData = JSON.stringify(options.embedData);
  }
  if (options?.flattenForms) {
    doc.flattenForms = true;
  }
  applyAttachmentOptions(doc, options);
  await Promise.all([resolveFonts(doc), resolveImages(doc)]);
  return renderPdf(JSON.stringify(doc));
}
var init_dist4 = __esm({
  "node_modules/@formepdf/core/dist/index.js"() {
    "use strict";
    init_result();
    init_attachments();
    init_extract();
  }
});

// renderer/vendor/registry/themes/primitives.ts
var defaultPrimitives;
var init_primitives = __esm({
  "renderer/vendor/registry/themes/primitives.ts"() {
    "use strict";
    defaultPrimitives = {
      borderRadius: {
        full: 9999,
        lg: 8,
        md: 4,
        none: 0,
        sm: 2
      },
      fontWeights: {
        bold: 700,
        medium: 500,
        regular: 400,
        semibold: 600
      },
      letterSpacing: {
        normal: 0,
        tight: -0.025,
        wide: 0.025,
        wider: 0.05
      },
      lineHeights: {
        normal: 1.4,
        relaxed: 1.6,
        tight: 1.2
      },
      spacing: {
        0: 0,
        0.5: 2,
        1: 4,
        10: 40,
        12: 48,
        16: 64,
        2: 8,
        3: 12,
        4: 16,
        5: 20,
        6: 24,
        8: 32
      },
      typography: {
        "2xl": 28,
        "3xl": 36,
        base: 15,
        lg: 18,
        sm: 12,
        xl: 22,
        xs: 10
      }
    };
  }
});

// renderer/vendor/registry/themes/professional.ts
var professionalTheme;
var init_professional = __esm({
  "renderer/vendor/registry/themes/professional.ts"() {
    "use strict";
    init_primitives();
    professionalTheme = {
      colors: {
        accent: "#3b82f6",
        background: "#ffffff",
        border: "#e4e4e7",
        destructive: "#dc2626",
        foreground: "#18181b",
        info: "#0ea5e9",
        muted: "#f4f4f5",
        mutedForeground: "#71717a",
        primary: "#18181b",
        primaryForeground: "#ffffff",
        success: "#16a34a",
        warning: "#d97706"
      },
      name: "professional",
      page: {
        orientation: "portrait",
        size: "A4"
      },
      primitives: defaultPrimitives,
      spacing: {
        componentGap: 14,
        page: {
          marginBottom: 56,
          marginLeft: 48,
          marginRight: 48,
          marginTop: 56
        },
        paragraphGap: 10,
        sectionGap: 28
      },
      typography: {
        body: {
          fontFamily: "Helvetica",
          fontSize: 11,
          lineHeight: 1.6
        },
        heading: {
          fontFamily: "Times-Roman",
          fontSize: {
            h1: 32,
            h2: 24,
            h3: 20,
            h4: 16,
            h5: 14,
            h6: 12
          },
          fontWeight: 700,
          lineHeight: 1.25
        }
      }
    };
  }
});

// renderer/vendor/registry/bases/forme/components/theme-provider.tsx
var import_react3, serializedTheme, mergeStyleInput, mergePdfStyles, renderForSerializer, PdfcnThemeProvider, usePdfcnTheme, useSafeMemo;
var init_theme_provider = __esm({
  "renderer/vendor/registry/bases/forme/components/theme-provider.tsx"() {
    "use strict";
    import_react3 = __toESM(require_react(), 1);
    init_professional();
    serializedTheme = professionalTheme;
    mergeStyleInput = (target, input) => {
      if (Array.isArray(input)) {
        for (const item of input) {
          mergeStyleInput(target, item);
        }
      } else if (input) {
        Object.assign(target, input);
      }
    };
    mergePdfStyles = (...inputs) => {
      const merged = {};
      for (const input of inputs) {
        mergeStyleInput(merged, input);
      }
      return merged;
    };
    renderForSerializer = (children, theme2) => {
      serializedTheme = theme2;
      if (!(0, import_react3.isValidElement)(children) || typeof children.type !== "function") {
        return children;
      }
      if (children.type.__formeType === "Document") {
        return children;
      }
      return children.type(children.props);
    };
    PdfcnThemeProvider = ({
      theme: theme2,
      children
    }) => renderForSerializer(children, theme2 ?? professionalTheme);
    usePdfcnTheme = () => serializedTheme;
    useSafeMemo = (factory, _deps) => factory();
  }
});

// node_modules/react/cjs/react-jsx-runtime.production.js
var require_react_jsx_runtime_production = __commonJS({
  "node_modules/react/cjs/react-jsx-runtime.production.js"(exports) {
    "use strict";
    /**
     * @license React
     * react-jsx-runtime.production.js
     *
     * Copyright (c) Meta Platforms, Inc. and affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */
    var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
    var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
    function jsxProd(type, config, maybeKey) {
      var key = null;
      void 0 !== maybeKey && (key = "" + maybeKey);
      void 0 !== config.key && (key = "" + config.key);
      if ("key" in config) {
        maybeKey = {};
        for (var propName in config)
          "key" !== propName && (maybeKey[propName] = config[propName]);
      } else maybeKey = config;
      config = maybeKey.ref;
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref: void 0 !== config ? config : null,
        props: maybeKey
      };
    }
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsx = jsxProd;
    exports.jsxs = jsxProd;
  }
});

// node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS({
  "node_modules/react/jsx-runtime.js"(exports, module) {
    "use strict";
    if (true) {
      module.exports = require_react_jsx_runtime_production();
    } else {
      module.exports = null;
    }
  }
});

// renderer/vendor/registry/bases/forme/lib/pdf-primitives.tsx
var import_jsx_runtime, mergeFormeStyles, View2, Text2, Fixed2;
var init_pdf_primitives = __esm({
  "renderer/vendor/registry/bases/forme/lib/pdf-primitives.tsx"() {
    "use strict";
    init_dist3();
    import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
    mergeFormeStyles = (input) => {
      if (!input) {
        return void 0;
      }
      if (!Array.isArray(input)) {
        return input;
      }
      const merged = {};
      for (const entry of input) {
        const resolved = mergeFormeStyles(entry);
        if (resolved) {
          Object.assign(merged, resolved);
        }
      }
      return Object.keys(merged).length > 0 ? merged : void 0;
    };
    View2 = ({ style, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(View, { ...props, style: mergeFormeStyles(style) });
    Text2 = ({ style, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, { ...props, style: mergeFormeStyles(style) });
    Fixed2 = ({ style, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fixed, { ...props, style: mergeFormeStyles(style) });
  }
});

// renderer/vendor/registry/bases/forme/lib/resolve-color.ts
var THEME_COLOR_KEYS, resolveColor;
var init_resolve_color = __esm({
  "renderer/vendor/registry/bases/forme/lib/resolve-color.ts"() {
    "use strict";
    THEME_COLOR_KEYS = [
      "foreground",
      "background",
      "muted",
      "mutedForeground",
      "primary",
      "primaryForeground",
      "border",
      "accent",
      "destructive",
      "success",
      "warning",
      "info"
    ];
    resolveColor = (value, colors) => {
      const key = value;
      return THEME_COLOR_KEYS.includes(key) ? colors[key] : value;
    };
  }
});

// renderer/vendor/registry/bases/forme/components/text/text.tsx
var import_jsx_runtime2, createTextStyles, Text3;
var init_text = __esm({
  "renderer/vendor/registry/bases/forme/components/text/text.tsx"() {
    "use strict";
    init_theme_provider();
    init_pdf_primitives();
    init_resolve_color();
    import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
    createTextStyles = (t) => {
      const { fontWeights, letterSpacing } = t.primitives;
      const base = {
        color: t.colors.foreground,
        fontFamily: t.typography.body.fontFamily,
        lineHeight: t.typography.body.lineHeight,
        marginBottom: t.spacing.paragraphGap,
        marginTop: 0
      };
      return StyleSheet.create({
        "2xl": { ...base, fontSize: t.primitives.typography["2xl"] },
        "3xl": { ...base, fontSize: t.primitives.typography["3xl"] },
        base: { ...base, fontSize: t.primitives.typography.base },
        capitalize: { textTransform: "capitalize" },
        decorationNone: { textDecoration: "none" },
        italic: { fontStyle: "italic" },
        lg: { ...base, fontSize: t.primitives.typography.lg },
        lineThrough: { textDecoration: "line-through" },
        lowercase: { textTransform: "lowercase" },
        noMargin: { marginBottom: 0, marginTop: 0 },
        sm: { ...base, fontSize: t.primitives.typography.sm },
        text: { ...base, fontSize: t.typography.body.fontSize },
        underline: { textDecoration: "underline" },
        uppercase: {
          letterSpacing: letterSpacing.wider * 10,
          textTransform: "uppercase"
        },
        weightBold: { fontWeight: fontWeights.bold },
        weightMedium: { fontWeight: fontWeights.medium },
        weightNormal: { fontWeight: fontWeights.regular },
        weightSemibold: { fontWeight: fontWeights.semibold },
        xl: { ...base, fontSize: t.primitives.typography.xl },
        xs: { ...base, fontSize: t.primitives.typography.xs }
      });
    };
    Text3 = ({
      variant,
      align,
      color,
      weight,
      italic,
      decoration,
      transform,
      noMargin,
      children,
      style
    }) => {
      const theme2 = usePdfcnTheme();
      const styles = useSafeMemo(() => createTextStyles(theme2), [theme2]);
      const weightMap = {
        bold: styles.weightBold,
        medium: styles.weightMedium,
        normal: styles.weightNormal,
        semibold: styles.weightSemibold
      };
      const decorationMap = {
        "line-through": styles.lineThrough,
        none: styles.decorationNone,
        underline: styles.underline
      };
      const transformMap = {
        capitalize: styles.capitalize,
        lowercase: styles.lowercase,
        uppercase: styles.uppercase
      };
      const styleArray = [variant ? styles[variant] : styles.text];
      if (weight && weight in weightMap) {
        styleArray.push(weightMap[weight]);
      }
      if (italic) {
        styleArray.push(styles.italic);
      }
      if (decoration && decoration in decorationMap) {
        styleArray.push(decorationMap[decoration]);
      }
      if (transform && transform in transformMap) {
        styleArray.push(transformMap[transform]);
      }
      if (noMargin) {
        styleArray.push(styles.noMargin);
      }
      const semantic = {};
      if (align) {
        semantic.textAlign = align;
      }
      if (color) {
        semantic.color = resolveColor(color, theme2.colors);
      }
      if (Object.keys(semantic).length > 0) {
        styleArray.push(semantic);
      }
      if (style) {
        styleArray.push(...[style].flat());
      }
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Text2, { style: mergePdfStyles(styleArray), children });
    };
  }
});

// renderer/vendor/registry/bases/forme/components/page-header/page-header.tsx
var import_jsx_runtime3, wrapFixed, createPageHeaderStyles, buildContainerStyles, buildTitleStyles, renderBranded, renderCentered, renderLogoRight, renderLogoLeft, renderTwoColumn, renderMinimal, renderSimple, PageHeader;
var init_page_header = __esm({
  "renderer/vendor/registry/bases/forme/components/page-header/page-header.tsx"() {
    "use strict";
    init_theme_provider();
    init_pdf_primitives();
    init_resolve_color();
    import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
    wrapFixed = (fixed, node) => {
      if (!fixed) {
        return node;
      }
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Fixed2, { position: "header", children: node });
    };
    createPageHeaderStyles = (t) => {
      const { spacing, borderRadius, fontWeights } = t.primitives;
      const c = t.colors;
      const { heading, body } = t.typography;
      return StyleSheet.create({
        brandedContainer: {
          alignItems: "center",
          backgroundColor: c.primary,
          borderRadius: borderRadius.sm,
          display: "flex",
          flexDirection: "column",
          padding: spacing[6]
        },
        centeredContainer: {
          alignItems: "center",
          borderBottomColor: c.border,
          borderBottomStyle: "solid",
          borderBottomWidth: spacing[0.5],
          display: "flex",
          flexDirection: "column",
          paddingBottom: spacing[4]
        },
        contactInfo: {
          color: c.mutedForeground,
          fontFamily: body.fontFamily,
          fontSize: t.primitives.typography.xs,
          marginTop: spacing[0.5],
          textAlign: "right"
        },
        logoContainer: {
          flexShrink: 0,
          height: 48,
          marginRight: spacing[4],
          width: 48
        },
        logoContent: {
          display: "flex",
          flex: 1,
          flexDirection: "column",
          paddingLeft: spacing[4]
        },
        logoLeftContainer: {
          alignItems: "center",
          borderBottomColor: c.border,
          borderBottomStyle: "solid",
          borderBottomWidth: spacing[0.5],
          display: "flex",
          flexDirection: "row",
          paddingBottom: spacing[4]
        },
        logoRightContainer: {
          alignItems: "center",
          borderBottomColor: c.border,
          borderBottomStyle: "solid",
          borderBottomWidth: spacing[0.5],
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingBottom: spacing[4]
        },
        logoRightContent: {
          display: "flex",
          flex: 1,
          flexDirection: "column"
        },
        logoRightLogoContainer: {
          flexShrink: 0,
          height: 48,
          marginLeft: spacing[4],
          width: 48
        },
        minimalContainer: {
          alignItems: "center",
          borderBottomColor: c.primary,
          borderBottomStyle: "solid",
          borderBottomWidth: spacing[1],
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingBottom: spacing[3]
        },
        minimalLeft: {
          flex: 1
        },
        minimalRight: {
          alignItems: "flex-end"
        },
        rightSubText: {
          color: c.mutedForeground,
          fontFamily: body.fontFamily,
          fontSize: t.primitives.typography.xs,
          marginTop: spacing[1],
          textAlign: "right"
        },
        rightText: {
          color: c.foreground,
          fontFamily: body.fontFamily,
          fontSize: body.fontSize,
          fontWeight: fontWeights.medium,
          textAlign: "right"
        },
        simpleContainer: {
          alignItems: "flex-start",
          borderBottomColor: c.border,
          borderBottomStyle: "solid",
          borderBottomWidth: spacing[0.5],
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingBottom: spacing[4]
        },
        simpleLeft: {
          display: "flex",
          flex: 1,
          flexDirection: "column"
        },
        simpleRight: {
          alignItems: "flex-end",
          display: "flex",
          flexDirection: "column"
        },
        subtitle: {
          color: c.mutedForeground,
          fontFamily: body.fontFamily,
          fontSize: body.fontSize,
          lineHeight: body.lineHeight,
          marginTop: spacing[1]
        },
        subtitleBranded: {
          color: c.primaryForeground,
          marginTop: spacing[1]
        },
        subtitleCentered: {
          textAlign: "center"
        },
        title: {
          color: c.foreground,
          fontFamily: heading.fontFamily,
          fontSize: heading.fontSize.h3,
          fontWeight: fontWeights.bold,
          lineHeight: heading.lineHeight,
          marginBottom: 0
        },
        titleBranded: {
          color: c.primaryForeground
        },
        titleCentered: {
          textAlign: "center"
        },
        titleMinimal: {
          fontSize: heading.fontSize.h3,
          fontWeight: fontWeights.bold
        },
        twoColumnContainer: {
          alignItems: "flex-start",
          borderBottomColor: c.border,
          borderBottomStyle: "solid",
          borderBottomWidth: spacing[0.5],
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingBottom: spacing[4]
        },
        twoColumnLeft: {
          display: "flex",
          flex: 1,
          flexDirection: "column"
        },
        twoColumnRight: {
          alignItems: "flex-end",
          display: "flex",
          flexDirection: "column"
        }
      });
    };
    buildContainerStyles = (base, mb, background, theme2, style, ...extras) => {
      const result = [base, { marginBottom: mb }, ...extras];
      if (background) {
        result.push({ backgroundColor: resolveColor(background, theme2.colors) });
      }
      if (style) {
        result.push(style);
      }
      return result;
    };
    buildTitleStyles = (base, titleColor, theme2) => {
      if (!titleColor) {
        return base;
      }
      return [...base, { color: resolveColor(titleColor, theme2.colors) }];
    };
    renderBranded = (styles, containerStyles, titleStyles, title, subtitle, noWrap) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { wrap: !noWrap, style: containerStyles, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: titleStyles, children: title }),
      subtitle && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: [styles.subtitle, styles.subtitleBranded], children: subtitle })
    ] });
    renderCentered = (styles, containerStyles, titleStyles, title, subtitle, noWrap) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { wrap: !noWrap, style: containerStyles, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: titleStyles, children: title }),
      subtitle && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: [styles.subtitle, styles.subtitleCentered], children: subtitle })
    ] });
    renderLogoRight = (styles, containerStyles, titleStyles, title, subtitle, logo, noWrap) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { wrap: !noWrap, style: containerStyles, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { style: styles.logoRightContent, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: titleStyles, children: title }),
        subtitle && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.subtitle, children: subtitle })
      ] }),
      logo && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(View2, { style: styles.logoRightLogoContainer, children: logo })
    ] });
    renderLogoLeft = (styles, containerStyles, titleStyles, title, subtitle, logo, rightText, rightSubText, noWrap) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { wrap: !noWrap, style: containerStyles, children: [
      logo && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(View2, { style: styles.logoContainer, children: logo }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { style: styles.logoContent, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: titleStyles, children: title }),
        subtitle && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.subtitle, children: subtitle })
      ] }),
      (rightText || rightSubText) && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { style: styles.simpleRight, children: [
        rightText && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.rightText, children: rightText }),
        rightSubText && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.rightSubText, children: rightSubText })
      ] })
    ] });
    renderTwoColumn = (styles, containerStyles, titleStyles, title, subtitle, address, phone, email, noWrap) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { wrap: !noWrap, style: containerStyles, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { style: styles.twoColumnLeft, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: titleStyles, children: title }),
        subtitle && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.subtitle, children: subtitle })
      ] }),
      (address || phone || email) && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { style: styles.twoColumnRight, children: [
        address && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.contactInfo, children: address }),
        phone && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.contactInfo, children: phone }),
        email && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.contactInfo, children: email })
      ] })
    ] });
    renderMinimal = (styles, containerStyles, titleStyles, title, subtitle, rightText, rightSubText, noWrap) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { wrap: !noWrap, style: containerStyles, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { style: styles.minimalLeft, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: titleStyles, children: title }),
        subtitle && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.subtitle, children: subtitle })
      ] }),
      (rightText || rightSubText) && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { style: styles.minimalRight, children: [
        rightText && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.rightText, children: rightText }),
        rightSubText && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.rightSubText, children: rightSubText })
      ] })
    ] });
    renderSimple = (styles, containerStyles, titleStyles, title, subtitle, rightText, rightSubText, noWrap) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { wrap: !noWrap, style: containerStyles, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { style: styles.simpleLeft, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: titleStyles, children: title }),
        subtitle && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.subtitle, children: subtitle })
      ] }),
      (rightText || rightSubText) && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(View2, { style: styles.simpleRight, children: [
        rightText && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.rightText, children: rightText }),
        rightSubText && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Text2, { style: styles.rightSubText, children: rightSubText })
      ] })
    ] });
    PageHeader = ({
      title,
      subtitle,
      rightText,
      rightSubText,
      variant = "simple",
      background,
      titleColor,
      marginBottom,
      logo,
      address,
      phone,
      email,
      fixed = false,
      noWrap = true,
      style
    }) => {
      const theme2 = usePdfcnTheme();
      const styles = useSafeMemo(() => createPageHeaderStyles(theme2), [theme2]);
      const mb = marginBottom ?? theme2.spacing.sectionGap;
      const variantRenderers = {
        branded: () => renderBranded(
          styles,
          buildContainerStyles(
            styles.brandedContainer,
            mb,
            background,
            theme2,
            style
          ),
          buildTitleStyles(
            [styles.title, styles.titleBranded, styles.titleCentered],
            titleColor,
            theme2
          ),
          title,
          subtitle,
          noWrap
        ),
        centered: () => renderCentered(
          styles,
          buildContainerStyles(
            styles.centeredContainer,
            mb,
            background,
            theme2,
            style
          ),
          buildTitleStyles(
            [styles.title, styles.titleCentered],
            titleColor,
            theme2
          ),
          title,
          subtitle,
          noWrap
        ),
        "logo-left": () => renderLogoLeft(
          styles,
          buildContainerStyles(
            styles.logoLeftContainer,
            mb,
            background,
            theme2,
            style
          ),
          buildTitleStyles([styles.title], titleColor, theme2),
          title,
          subtitle,
          logo,
          rightText,
          rightSubText,
          noWrap
        ),
        "logo-right": () => renderLogoRight(
          styles,
          buildContainerStyles(
            styles.logoRightContainer,
            mb,
            background,
            theme2,
            style
          ),
          buildTitleStyles([styles.title], titleColor, theme2),
          title,
          subtitle,
          logo,
          noWrap
        ),
        minimal: () => renderMinimal(
          styles,
          buildContainerStyles(
            styles.minimalContainer,
            mb,
            background,
            theme2,
            style
          ),
          buildTitleStyles(
            [styles.title, styles.titleMinimal],
            titleColor,
            theme2
          ),
          title,
          subtitle,
          rightText,
          rightSubText,
          noWrap
        ),
        simple: () => renderSimple(
          styles,
          buildContainerStyles(
            styles.simpleContainer,
            mb,
            background,
            theme2,
            style
          ),
          buildTitleStyles([styles.title], titleColor, theme2),
          title,
          subtitle,
          rightText,
          rightSubText,
          noWrap
        ),
        "two-column": () => renderTwoColumn(
          styles,
          buildContainerStyles(
            styles.twoColumnContainer,
            mb,
            background,
            theme2,
            style
          ),
          buildTitleStyles([styles.title], titleColor, theme2),
          title,
          subtitle,
          address,
          phone,
          email,
          noWrap
        )
      };
      return wrapFixed(fixed, variantRenderers[variant]());
    };
  }
});

// renderer/invoice.tsx
var invoice_exports = {};
__export(invoice_exports, {
  renderInvoice: () => renderInvoice
});
import { fileURLToPath } from "node:url";
function Content({ data: d }) {
  const t = totals(d);
  const pages = [];
  for (let i = 0; i < d.items.length; i += 5) pages.push(d.items.slice(i, i + 5));
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Document, { title: `Invoice ${d.number}`, fonts, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_jsx_runtime4.Fragment, { children: pages.map((items, p) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Page, { size: "A4", margin: 40, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PageHeader, { title: d.company, subtitle: "INVOICE", variant: "minimal" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(View, { style: { flexDirection: "row", marginBottom: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(View, { style: { width: "55%", paddingRight: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { variant: "xs", children: d.companyAddress }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Text3, { variant: "sm", weight: "bold", children: [
          "Bill to: ",
          d.customer
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { variant: "xs", children: d.customerAddress })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(View, { style: { width: "45%" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { variant: "sm", weight: "bold", children: d.number }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Text3, { variant: "xs", children: [
          "Issued: ",
          d.date
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Text3, { variant: "xs", children: [
          "Due: ",
          d.due
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Text3, { variant: "xs", children: [
          "Currency: ",
          d.currency
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(View, { style: { flexDirection: "row", padding: 8, backgroundColor: "#eef1f5" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { style: { width: "46%" }, variant: "xs", noMargin: true, weight: "bold", children: "DESCRIPTION" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { style: { width: "12%" }, variant: "xs", noMargin: true, children: "QTY" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { style: { width: "21%" }, variant: "xs", noMargin: true, children: "RATE" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { style: { width: "21%" }, variant: "xs", noMargin: true, align: "right", children: "AMOUNT" })
    ] }),
    items.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(View, { wrap: false, style: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { style: { width: "46%", paddingRight: 10 }, variant: "xs", noMargin: true, children: line.description }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { style: { width: "12%" }, variant: "xs", noMargin: true, children: line.quantity }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { style: { width: "21%" }, variant: "xs", noMargin: true, children: money(totals({ ...d, items: [{ ...line, quantity: "1" }] }).subtotal, d.currency) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { style: { width: "21%" }, variant: "xs", noMargin: true, align: "right", children: money(t.lines[p * 5 + i], d.currency) })
    ] }, i)),
    p === pages.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(View, { wrap: false, style: { marginTop: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Text3, { variant: "sm", align: "right", children: [
        "Subtotal: ",
        money(t.subtotal, d.currency)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Text3, { variant: "sm", align: "right", children: [
        "Tax (",
        d.taxRate,
        "%): ",
        money(t.tax, d.currency)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Text3, { variant: "lg", align: "right", weight: "bold", children: [
        "Total: ",
        money(t.total, d.currency)
      ] }),
      d.payment && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Text3, { variant: "xs", children: [
        "Payment details: ",
        d.payment
      ] }),
      d.notes && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Text3, { variant: "xs", children: d.notes })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Text3, { variant: "xs", color: "mutedForeground", style: { marginTop: 24 }, children: [
      d.number,
      " \xB7 Section ",
      p + 1,
      " of ",
      pages.length
    ] })
  ] }, p)) }) });
}
async function renderInvoice(data) {
  validate(data, true);
  const document = serialize2(/* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PdfcnThemeProvider, { theme, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Content, { data }) }));
  return Buffer.from(await renderSerializedDoc(document));
}
var import_jsx_runtime4, theme, fonts;
var init_invoice = __esm({
  "renderer/invoice.tsx"() {
    "use strict";
    init_dist3();
    init_dist4();
    init_professional();
    init_text();
    init_page_header();
    init_theme_provider();
    init_model();
    import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
    theme = structuredClone(professionalTheme);
    theme.typography.body.fontFamily = "DejaVu Sans";
    theme.typography.heading.fontFamily = "DejaVu Sans";
    fonts = [{ family: "DejaVu Sans", src: fileURLToPath(new URL("../renderer/fonts/DejaVuSans.ttf", import.meta.url)) }, { family: "DejaVu Sans", src: fileURLToPath(new URL("../renderer/fonts/DejaVuSans-Bold.ttf", import.meta.url)), fontWeight: 700 }];
  }
});

// renderer/io.ts
import { open } from "node:fs/promises";
import { constants } from "node:fs";
var MAX_REQUEST_BYTES = 256 * 1024;
async function requestLine(input) {
  const chunks = [];
  let size = 0;
  for await (const value of input) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
    const newline = chunk.indexOf(10);
    const part = newline < 0 ? chunk : chunk.subarray(0, newline);
    size += part.length;
    if (size > MAX_REQUEST_BYTES) throw Error("Request is too large.");
    chunks.push(part);
    if (newline >= 0) return Buffer.concat(chunks, size).toString("utf8");
  }
  if (!size) throw Error("No request received.");
  return Buffer.concat(chunks, size).toString("utf8");
}
async function readBounded(path, limit) {
  const file = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > limit) throw Error("Draft storage exceeds the supported size or is not a regular file.");
    const chunks = [];
    let size = 0;
    while (true) {
      const buffer = Buffer.alloc(Math.min(65536, limit + 1 - size));
      const { bytesRead } = await file.read(buffer, 0, buffer.length, null);
      if (!bytesRead) break;
      size += bytesRead;
      if (size > limit) throw Error("Draft storage exceeds the supported size.");
      chunks.push(buffer.subarray(0, bytesRead));
    }
    return Buffer.concat(chunks, size).toString("utf8");
  } finally {
    await file.close();
  }
}
function errorReply(error) {
  return { ok: false, error: String(error || "Operation failed.").slice(0, 1024) };
}
function encodeReply(value) {
  const json = JSON.stringify(value);
  if (Buffer.byteLength(json) > MAX_REQUEST_BYTES) throw Error("Renderer response is too large.");
  return json + "\n";
}
function reply(value) {
  process.stdout.write(encodeReply(value));
}

// renderer/cli.ts
import { pathToFileURL } from "node:url";
import { mkdir as mkdir2, writeFile } from "node:fs/promises";
import { join as join2 } from "node:path";
import { homedir as homedir2 } from "node:os";
import { randomUUID as randomUUID3 } from "node:crypto";

// renderer/store.ts
init_model();
import { mkdir, open as open3, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomUUID as randomUUID2 } from "node:crypto";

// renderer/lock.ts
import { open as open2 } from "node:fs/promises";
import { spawn } from "node:child_process";
async function acquireLock(path) {
  const file = await open2(path, "a", 384);
  await file.close();
  const child = spawn("/usr/bin/flock", [
    "--exclusive",
    "--nonblock",
    path,
    process.execPath,
    "-e",
    "process.stdin.resume();process.stdout.write('locked\\n');"
  ], { stdio: ["pipe", "pipe", "ignore"] });
  let failure;
  child.stdin.on("error", () => {
  });
  const exited = new Promise((resolve2) => {
    child.once("error", (e) => {
      failure = e;
      resolve2();
    });
    child.once("exit", () => resolve2());
  });
  try {
    await new Promise((resolve2, reject) => {
      child.stdout.once("data", () => resolve2());
      void exited.then(() => reject(failure || Error("Draft storage is locked. Another save may be running; retry shortly.")));
    });
  } catch (e) {
    child.stdin.end();
    await exited;
    throw e;
  }
  return async () => {
    child.stdin.end();
    await exited;
  };
}

// renderer/store.ts
var MAX_STORE_BYTES = 16 * 1024 * 1024;
var MAX_DRAFTS = 1e3;
var PAGE_SIZE = 50;
var Store = class {
  constructor(directory = join(process.env.XDG_DATA_HOME || join(homedir(), ".local/share"), "omarchy-pdf-studio")) {
    this.directory = directory;
  }
  directory;
  async read() {
    try {
      const s = JSON.parse(await readBounded(join(this.directory, "drafts.json"), MAX_STORE_BYTES));
      if (!s || s.schema !== 1 || !Number.isSafeInteger(s.next) || s.next < 1 || s.next >= Number.MAX_SAFE_INTEGER || !Array.isArray(s.drafts) || s.drafts.length > MAX_DRAFTS) throw Error("Invalid data format.");
      const drafts = s.drafts.map((d) => validate(d));
      if (new Set(drafts.map((d) => d.id)).size !== drafts.length || new Set(drafts.map((d) => d.number)).size !== drafts.length) throw Error("Duplicate draft identities or invoice numbers.");
      return { schema: 1, next: s.next, drafts };
    } catch (e) {
      if (e.code === "ENOENT") return { schema: 1, next: 1, drafts: [] };
      throw Error("Cannot read saved drafts. Your data has not been overwritten. " + e.message);
    }
  }
  async list(offset = 0) {
    if (typeof offset !== "number" || !Number.isSafeInteger(offset) || offset < 0 || offset >= MAX_DRAFTS || offset % PAGE_SIZE !== 0) throw Error("Invalid draft page.");
    const { drafts } = await this.read();
    return { drafts: drafts.slice(offset, offset + PAGE_SIZE).map(({ id, number }) => ({ id, number })), offset, total: drafts.length };
  }
  async load(id) {
    if (typeof id !== "string" || id.length !== 36) throw Error("Invalid draft identity.");
    const d = (await this.read()).drafts.find((d2) => d2.id === id);
    if (!d) throw Error("Draft no longer exists. Refresh the saved drafts.");
    return d;
  }
  async save(input) {
    const d = structuredClone(validate(input));
    await mkdir(this.directory, { recursive: true, mode: 448 });
    const release = await acquireLock(join(this.directory, "write.lock"));
    try {
      const state = await this.read();
      const index = state.drafts.findIndex((x) => x.id === d.id);
      if (index >= 0 && state.drafts[index].revision !== d.revision || index < 0 && d.revision !== 0) throw Error("This draft changed elsewhere. Reopen the saved draft before editing.");
      if (!d.number.trim()) {
        do {
          d.number = `INV-${String(state.next++).padStart(5, "0")}`;
        } while (state.drafts.some((x) => x.number === d.number));
      }
      if (state.drafts.some((x) => x.id !== d.id && x.number === d.number)) throw Error("That invoice number is already used by another draft.");
      if (index < 0 && state.drafts.length >= MAX_DRAFTS) throw Error("Draft storage supports at most 1000 invoices. Existing drafts can still be edited.");
      if (state.next >= Number.MAX_SAFE_INTEGER) throw Error("Invoice numbering limit reached.");
      if (d.revision >= Number.MAX_SAFE_INTEGER) throw Error("Draft revision limit reached.");
      d.revision++;
      if (index < 0) state.drafts.unshift(d);
      else state.drafts[index] = d;
      const json = JSON.stringify(state);
      if (Buffer.byteLength(json) > MAX_STORE_BYTES) throw Error("Draft storage exceeds the 16 MiB limit. Your data has not been overwritten.");
      const temp = join(this.directory, `.drafts-${randomUUID2()}.tmp`);
      try {
        const file = await open3(temp, "wx", 384);
        try {
          await file.writeFile(json);
          await file.sync();
        } finally {
          await file.close();
        }
        await rename(temp, join(this.directory, "drafts.json"));
        const directory = await open3(this.directory, "r");
        try {
          await directory.sync();
        } finally {
          await directory.close();
        }
      } finally {
        await unlink(temp).catch(() => {
        });
      }
      return d;
    } finally {
      await release();
    }
  }
};

// renderer/cli.ts
init_model();
process.umask(63);
var timer = setTimeout(() => {
  reply(errorReply("Operation timed out."));
  process.exit(1);
}, 45e3);
try {
  const line = await requestLine(process.stdin);
  const r = JSON.parse(line);
  if (!r || typeof r !== "object" || Array.isArray(r) || typeof r.action !== "string") throw Error("Invalid request.");
  const store = new Store();
  let result;
  switch (r.action) {
    case "list":
      result = await store.list(r.offset ?? 0);
      break;
    case "load":
      result = { draft: await store.load(r.id) };
      break;
    case "new":
      result = { draft: fresh() };
      break;
    case "save":
      result = { draft: await store.save(r.draft) };
      break;
    case "total": {
      const d = validate(r.draft);
      const t = totals(d);
      result = { total: money(t.total, d.currency), subtotal: money(t.subtotal, d.currency), tax: money(t.tax, d.currency) };
      break;
    }
    case "preview":
    case "export": {
      const d = validate(r.draft, true);
      if (!d.number) throw Error("Save this draft to assign its invoice number first.");
      const { renderInvoice: renderInvoice2 } = await Promise.resolve().then(() => (init_invoice(), invoice_exports));
      const bytes = await renderInvoice2(d);
      const dir = r.action === "preview" ? join2(process.env.XDG_CACHE_HOME || join2(homedir2(), ".cache"), "omarchy-pdf-studio") : join2(homedir2(), "Documents", "PDF Studio");
      await mkdir2(dir, { recursive: true, mode: 448 });
      const path = join2(dir, `invoice-${d.id}-${randomUUID3()}.pdf`);
      await writeFile(path, bytes, { flag: "wx", mode: 384 });
      result = { path, url: pathToFileURL(path).href };
      break;
    }
    default:
      throw Error("Unknown action.");
  }
  reply({ ok: true, ...result });
} catch (e) {
  reply(errorReply(e.message || "Operation failed."));
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  process.stdin.destroy();
}
