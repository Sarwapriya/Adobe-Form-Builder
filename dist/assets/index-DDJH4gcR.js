var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t),e=null),t.exports),s=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},c=(n,r,a)=>(a=n==null?{}:e(i(n)),s(r||!n||!n.__esModule?t(a,`default`,{value:n,enumerable:!0}):a,n));(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var l=o((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.portal`),r=Symbol.for(`react.fragment`),i=Symbol.for(`react.strict_mode`),a=Symbol.for(`react.profiler`),o=Symbol.for(`react.consumer`),s=Symbol.for(`react.context`),c=Symbol.for(`react.forward_ref`),l=Symbol.for(`react.suspense`),u=Symbol.for(`react.memo`),d=Symbol.for(`react.lazy`),f=Symbol.for(`react.activity`),p=Symbol.iterator;function m(e){return typeof e!=`object`||!e?null:(e=p&&e[p]||e[`@@iterator`],typeof e==`function`?e:null)}var h={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},g=Object.assign,_={};function v(e,t,n){this.props=e,this.context=t,this.refs=_,this.updater=n||h}v.prototype.isReactComponent={},v.prototype.setState=function(e,t){if(typeof e!=`object`&&typeof e!=`function`&&e!=null)throw Error(`takes an object of state variables to update or a function which returns an object of state variables.`);this.updater.enqueueSetState(this,e,t,`setState`)},v.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,`forceUpdate`)};function y(){}y.prototype=v.prototype;function b(e,t,n){this.props=e,this.context=t,this.refs=_,this.updater=n||h}var x=b.prototype=new y;x.constructor=b,g(x,v.prototype),x.isPureReactComponent=!0;var S=Array.isArray;function C(){}var w={H:null,A:null,T:null,S:null},T=Object.prototype.hasOwnProperty;function E(e,n,r){var i=r.ref;return{$$typeof:t,type:e,key:n,ref:i===void 0?null:i,props:r}}function D(e,t){return E(e.type,t,e.props)}function O(e){return typeof e==`object`&&!!e&&e.$$typeof===t}function k(e){var t={"=":`=0`,":":`=2`};return`$`+e.replace(/[=:]/g,function(e){return t[e]})}var A=/\/+/g;function j(e,t){return typeof e==`object`&&e&&e.key!=null?k(``+e.key):t.toString(36)}function M(e){switch(e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason;default:switch(typeof e.status==`string`?e.then(C,C):(e.status=`pending`,e.then(function(t){e.status===`pending`&&(e.status=`fulfilled`,e.value=t)},function(t){e.status===`pending`&&(e.status=`rejected`,e.reason=t)})),e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason}}throw e}function N(e,r,i,a,o){var s=typeof e;(s===`undefined`||s===`boolean`)&&(e=null);var c=!1;if(e===null)c=!0;else switch(s){case`bigint`:case`string`:case`number`:c=!0;break;case`object`:switch(e.$$typeof){case t:case n:c=!0;break;case d:return c=e._init,N(c(e._payload),r,i,a,o)}}if(c)return o=o(e),c=a===``?`.`+j(e,0):a,S(o)?(i=``,c!=null&&(i=c.replace(A,`$&/`)+`/`),N(o,r,i,``,function(e){return e})):o!=null&&(O(o)&&(o=D(o,i+(o.key==null||e&&e.key===o.key?``:(``+o.key).replace(A,`$&/`)+`/`)+c)),r.push(o)),1;c=0;var l=a===``?`.`:a+`:`;if(S(e))for(var u=0;u<e.length;u++)a=e[u],s=l+j(a,u),c+=N(a,r,i,s,o);else if(u=m(e),typeof u==`function`)for(e=u.call(e),u=0;!(a=e.next()).done;)a=a.value,s=l+j(a,u++),c+=N(a,r,i,s,o);else if(s===`object`){if(typeof e.then==`function`)return N(M(e),r,i,a,o);throw r=String(e),Error(`Objects are not valid as a React child (found: `+(r===`[object Object]`?`object with keys {`+Object.keys(e).join(`, `)+`}`:r)+`). If you meant to render a collection of children, use an array instead.`)}return c}function P(e,t,n){if(e==null)return e;var r=[],i=0;return N(e,r,``,``,function(e){return t.call(n,e,i++)}),r}function ee(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(t){(e._status===0||e._status===-1)&&(e._status=1,e._result=t)},function(t){(e._status===0||e._status===-1)&&(e._status=2,e._result=t)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var F=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)},I={map:P,forEach:function(e,t,n){P(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return P(e,function(){t++}),t},toArray:function(e){return P(e,function(e){return e})||[]},only:function(e){if(!O(e))throw Error(`React.Children.only expected to receive a single React element child.`);return e}};e.Activity=f,e.Children=I,e.Component=v,e.Fragment=r,e.Profiler=a,e.PureComponent=b,e.StrictMode=i,e.Suspense=l,e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=w,e.__COMPILER_RUNTIME={__proto__:null,c:function(e){return w.H.useMemoCache(e)}},e.cache=function(e){return function(){return e.apply(null,arguments)}},e.cacheSignal=function(){return null},e.cloneElement=function(e,t,n){if(e==null)throw Error(`The argument must be a React element, but you passed `+e+`.`);var r=g({},e.props),i=e.key;if(t!=null)for(a in t.key!==void 0&&(i=``+t.key),t)!T.call(t,a)||a===`key`||a===`__self`||a===`__source`||a===`ref`&&t.ref===void 0||(r[a]=t[a]);var a=arguments.length-2;if(a===1)r.children=n;else if(1<a){for(var o=Array(a),s=0;s<a;s++)o[s]=arguments[s+2];r.children=o}return E(e.type,i,r)},e.createContext=function(e){return e={$$typeof:s,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:o,_context:e},e},e.createElement=function(e,t,n){var r,i={},a=null;if(t!=null)for(r in t.key!==void 0&&(a=``+t.key),t)T.call(t,r)&&r!==`key`&&r!==`__self`&&r!==`__source`&&(i[r]=t[r]);var o=arguments.length-2;if(o===1)i.children=n;else if(1<o){for(var s=Array(o),c=0;c<o;c++)s[c]=arguments[c+2];i.children=s}if(e&&e.defaultProps)for(r in o=e.defaultProps,o)i[r]===void 0&&(i[r]=o[r]);return E(e,a,i)},e.createRef=function(){return{current:null}},e.forwardRef=function(e){return{$$typeof:c,render:e}},e.isValidElement=O,e.lazy=function(e){return{$$typeof:d,_payload:{_status:-1,_result:e},_init:ee}},e.memo=function(e,t){return{$$typeof:u,type:e,compare:t===void 0?null:t}},e.startTransition=function(e){var t=w.T,n={};w.T=n;try{var r=e(),i=w.S;i!==null&&i(n,r),typeof r==`object`&&r&&typeof r.then==`function`&&r.then(C,F)}catch(e){F(e)}finally{t!==null&&n.types!==null&&(t.types=n.types),w.T=t}},e.unstable_useCacheRefresh=function(){return w.H.useCacheRefresh()},e.use=function(e){return w.H.use(e)},e.useActionState=function(e,t,n){return w.H.useActionState(e,t,n)},e.useCallback=function(e,t){return w.H.useCallback(e,t)},e.useContext=function(e){return w.H.useContext(e)},e.useDebugValue=function(){},e.useDeferredValue=function(e,t){return w.H.useDeferredValue(e,t)},e.useEffect=function(e,t){return w.H.useEffect(e,t)},e.useEffectEvent=function(e){return w.H.useEffectEvent(e)},e.useId=function(){return w.H.useId()},e.useImperativeHandle=function(e,t,n){return w.H.useImperativeHandle(e,t,n)},e.useInsertionEffect=function(e,t){return w.H.useInsertionEffect(e,t)},e.useLayoutEffect=function(e,t){return w.H.useLayoutEffect(e,t)},e.useMemo=function(e,t){return w.H.useMemo(e,t)},e.useOptimistic=function(e,t){return w.H.useOptimistic(e,t)},e.useReducer=function(e,t,n){return w.H.useReducer(e,t,n)},e.useRef=function(e){return w.H.useRef(e)},e.useState=function(e){return w.H.useState(e)},e.useSyncExternalStore=function(e,t,n){return w.H.useSyncExternalStore(e,t,n)},e.useTransition=function(){return w.H.useTransition()},e.version=`19.2.8`})),u=o(((e,t)=>{t.exports=l()})),d=o((e=>{function t(e,t){var n=e.length;e.push(t);a:for(;0<n;){var r=n-1>>>1,a=e[r];if(0<i(a,t))e[r]=t,e[n]=a,n=r;else break a}}function n(e){return e.length===0?null:e[0]}function r(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;a:for(var r=0,a=e.length,o=a>>>1;r<o;){var s=2*(r+1)-1,c=e[s],l=s+1,u=e[l];if(0>i(c,n))l<a&&0>i(u,c)?(e[r]=u,e[l]=n,r=l):(e[r]=c,e[s]=n,r=s);else if(l<a&&0>i(u,n))e[r]=u,e[l]=n,r=l;else break a}}return t}function i(e,t){var n=e.sortIndex-t.sortIndex;return n===0?e.id-t.id:n}if(e.unstable_now=void 0,typeof performance==`object`&&typeof performance.now==`function`){var a=performance;e.unstable_now=function(){return a.now()}}else{var o=Date,s=o.now();e.unstable_now=function(){return o.now()-s}}var c=[],l=[],u=1,d=null,f=3,p=!1,m=!1,h=!1,g=!1,_=typeof setTimeout==`function`?setTimeout:null,v=typeof clearTimeout==`function`?clearTimeout:null,y=typeof setImmediate<`u`?setImmediate:null;function b(e){for(var i=n(l);i!==null;){if(i.callback===null)r(l);else if(i.startTime<=e)r(l),i.sortIndex=i.expirationTime,t(c,i);else break;i=n(l)}}function x(e){if(h=!1,b(e),!m)if(n(c)!==null)m=!0,S||(S=!0,O());else{var t=n(l);t!==null&&j(x,t.startTime-e)}}var S=!1,C=-1,w=5,T=-1;function E(){return g?!0:!(e.unstable_now()-T<w)}function D(){if(g=!1,S){var t=e.unstable_now();T=t;var i=!0;try{a:{m=!1,h&&(h=!1,v(C),C=-1),p=!0;var a=f;try{b:{for(b(t),d=n(c);d!==null&&!(d.expirationTime>t&&E());){var o=d.callback;if(typeof o==`function`){d.callback=null,f=d.priorityLevel;var s=o(d.expirationTime<=t);if(t=e.unstable_now(),typeof s==`function`){d.callback=s,b(t),i=!0;break b}d===n(c)&&r(c),b(t)}else r(c);d=n(c)}if(d!==null)i=!0;else{var u=n(l);u!==null&&j(x,u.startTime-t),i=!1}}break a}finally{d=null,f=a,p=!1}i=void 0}}finally{i?O():S=!1}}}var O;if(typeof y==`function`)O=function(){y(D)};else if(typeof MessageChannel<`u`){var k=new MessageChannel,A=k.port2;k.port1.onmessage=D,O=function(){A.postMessage(null)}}else O=function(){_(D,0)};function j(t,n){C=_(function(){t(e.unstable_now())},n)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(e){e.callback=null},e.unstable_forceFrameRate=function(e){0>e||125<e?console.error(`forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`):w=0<e?Math.floor(1e3/e):5},e.unstable_getCurrentPriorityLevel=function(){return f},e.unstable_next=function(e){switch(f){case 1:case 2:case 3:var t=3;break;default:t=f}var n=f;f=t;try{return e()}finally{f=n}},e.unstable_requestPaint=function(){g=!0},e.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=f;f=e;try{return t()}finally{f=n}},e.unstable_scheduleCallback=function(r,i,a){var o=e.unstable_now();switch(typeof a==`object`&&a?(a=a.delay,a=typeof a==`number`&&0<a?o+a:o):a=o,r){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=a+s,r={id:u++,callback:i,priorityLevel:r,startTime:a,expirationTime:s,sortIndex:-1},a>o?(r.sortIndex=a,t(l,r),n(c)===null&&r===n(l)&&(h?(v(C),C=-1):h=!0,j(x,a-o))):(r.sortIndex=s,t(c,r),m||p||(m=!0,S||(S=!0,O()))),r},e.unstable_shouldYield=E,e.unstable_wrapCallback=function(e){var t=f;return function(){var n=f;f=t;try{return e.apply(this,arguments)}finally{f=n}}}})),f=o(((e,t)=>{t.exports=d()})),p=o((e=>{var t=u();function n(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function r(){}var i={d:{f:r,r:function(){throw Error(n(522))},D:r,C:r,L:r,m:r,X:r,S:r,M:r},p:0,findDOMNode:null},a=Symbol.for(`react.portal`);function o(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:a,key:r==null?null:``+r,children:e,containerInfo:t,implementation:n}}var s=t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function c(e,t){if(e===`font`)return``;if(typeof t==`string`)return t===`use-credentials`?t:``}e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=i,e.createPortal=function(e,t){var r=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(n(299));return o(e,t,null,r)},e.flushSync=function(e){var t=s.T,n=i.p;try{if(s.T=null,i.p=2,e)return e()}finally{s.T=t,i.p=n,i.d.f()}},e.preconnect=function(e,t){typeof e==`string`&&(t?(t=t.crossOrigin,t=typeof t==`string`?t===`use-credentials`?t:``:void 0):t=null,i.d.C(e,t))},e.prefetchDNS=function(e){typeof e==`string`&&i.d.D(e)},e.preinit=function(e,t){if(typeof e==`string`&&t&&typeof t.as==`string`){var n=t.as,r=c(n,t.crossOrigin),a=typeof t.integrity==`string`?t.integrity:void 0,o=typeof t.fetchPriority==`string`?t.fetchPriority:void 0;n===`style`?i.d.S(e,typeof t.precedence==`string`?t.precedence:void 0,{crossOrigin:r,integrity:a,fetchPriority:o}):n===`script`&&i.d.X(e,{crossOrigin:r,integrity:a,fetchPriority:o,nonce:typeof t.nonce==`string`?t.nonce:void 0})}},e.preinitModule=function(e,t){if(typeof e==`string`)if(typeof t==`object`&&t){if(t.as==null||t.as===`script`){var n=c(t.as,t.crossOrigin);i.d.M(e,{crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0})}}else t??i.d.M(e)},e.preload=function(e,t){if(typeof e==`string`&&typeof t==`object`&&t&&typeof t.as==`string`){var n=t.as,r=c(n,t.crossOrigin);i.d.L(e,n,{crossOrigin:r,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,type:typeof t.type==`string`?t.type:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy==`string`?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet==`string`?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes==`string`?t.imageSizes:void 0,media:typeof t.media==`string`?t.media:void 0})}},e.preloadModule=function(e,t){if(typeof e==`string`)if(t){var n=c(t.as,t.crossOrigin);i.d.m(e,{as:typeof t.as==`string`&&t.as!==`script`?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0})}else i.d.m(e)},e.requestFormReset=function(e){i.d.r(e)},e.unstable_batchedUpdates=function(e,t){return e(t)},e.useFormState=function(e,t,n){return s.H.useFormState(e,t,n)},e.useFormStatus=function(){return s.H.useHostTransitionStatus()},e.version=`19.2.8`})),m=o(((e,t)=>{function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>`u`||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!=`function`))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=p()})),h=o((e=>{var t=f(),n=u(),r=m();function i(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function a(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function o(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function s(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function c(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function l(e){if(o(e)!==e)throw Error(i(188))}function d(e){var t=e.alternate;if(!t){if(t=o(e),t===null)throw Error(i(188));return t===e?e:null}for(var n=e,r=t;;){var a=n.return;if(a===null)break;var s=a.alternate;if(s===null){if(r=a.return,r!==null){n=r;continue}break}if(a.child===s.child){for(s=a.child;s;){if(s===n)return l(a),e;if(s===r)return l(a),t;s=s.sibling}throw Error(i(188))}if(n.return!==r.return)n=a,r=s;else{for(var c=!1,u=a.child;u;){if(u===n){c=!0,n=a,r=s;break}if(u===r){c=!0,r=a,n=s;break}u=u.sibling}if(!c){for(u=s.child;u;){if(u===n){c=!0,n=s,r=a;break}if(u===r){c=!0,r=s,n=a;break}u=u.sibling}if(!c)throw Error(i(189))}}if(n.alternate!==r)throw Error(i(190))}if(n.tag!==3)throw Error(i(188));return n.stateNode.current===n?e:t}function p(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=p(e),t!==null)return t;e=e.sibling}return null}var h=Object.assign,g=Symbol.for(`react.element`),_=Symbol.for(`react.transitional.element`),v=Symbol.for(`react.portal`),y=Symbol.for(`react.fragment`),b=Symbol.for(`react.strict_mode`),x=Symbol.for(`react.profiler`),S=Symbol.for(`react.consumer`),C=Symbol.for(`react.context`),w=Symbol.for(`react.forward_ref`),T=Symbol.for(`react.suspense`),E=Symbol.for(`react.suspense_list`),D=Symbol.for(`react.memo`),O=Symbol.for(`react.lazy`),k=Symbol.for(`react.activity`),A=Symbol.for(`react.memo_cache_sentinel`),j=Symbol.iterator;function M(e){return typeof e!=`object`||!e?null:(e=j&&e[j]||e[`@@iterator`],typeof e==`function`?e:null)}var N=Symbol.for(`react.client.reference`);function P(e){if(e==null)return null;if(typeof e==`function`)return e.$$typeof===N?null:e.displayName||e.name||null;if(typeof e==`string`)return e;switch(e){case y:return`Fragment`;case x:return`Profiler`;case b:return`StrictMode`;case T:return`Suspense`;case E:return`SuspenseList`;case k:return`Activity`}if(typeof e==`object`)switch(e.$$typeof){case v:return`Portal`;case C:return e.displayName||`Context`;case S:return(e._context.displayName||`Context`)+`.Consumer`;case w:var t=e.render;return e=e.displayName,e||=(e=t.displayName||t.name||``,e===``?`ForwardRef`:`ForwardRef(`+e+`)`),e;case D:return t=e.displayName||null,t===null?P(e.type)||`Memo`:t;case O:t=e._payload,e=e._init;try{return P(e(t))}catch{}}return null}var ee=Array.isArray,F=n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,I=r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,te={pending:!1,data:null,method:null,action:null},ne=[],L=-1;function R(e){return{current:e}}function z(e){0>L||(e.current=ne[L],ne[L]=null,L--)}function B(e,t){L++,ne[L]=e.current,e.current=t}var V=R(null),re=R(null),H=R(null),U=R(null);function ie(e,t){switch(B(H,t),B(re,e),B(V,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?Gd(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=Gd(t),e=Kd(t,e);else switch(e){case`svg`:e=1;break;case`math`:e=2;break;default:e=0}}z(V),B(V,e)}function ae(){z(V),z(re),z(H)}function oe(e){e.memoizedState!==null&&B(U,e);var t=V.current,n=Kd(t,e.type);t!==n&&(B(re,e),B(V,n))}function W(e){re.current===e&&(z(V),z(re)),U.current===e&&(z(U),np._currentValue=te)}var se,ce;function le(e){if(se===void 0)try{throw Error()}catch(e){var t=e.stack.trim().match(/\n( *(at )?)/);se=t&&t[1]||``,ce=-1<e.stack.indexOf(`
    at`)?` (<anonymous>)`:-1<e.stack.indexOf(`@`)?`@unknown:0:0`:``}return`
`+se+e+ce}var ue=!1;function de(e,t){if(!e||ue)return``;ue=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(t){var n=function(){throw Error()};if(Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect==`object`&&Reflect.construct){try{Reflect.construct(n,[])}catch(e){var r=e}Reflect.construct(e,[],n)}else{try{n.call()}catch(e){r=e}e.call(n.prototype)}}else{try{throw Error()}catch(e){r=e}(n=e())&&typeof n.catch==`function`&&n.catch(function(){})}}catch(e){if(e&&r&&typeof e.stack==`string`)return[e.stack,r.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName=`DetermineComponentFrameRoot`;var i=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,`name`);i&&i.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:`DetermineComponentFrameRoot`});var a=r.DetermineComponentFrameRoot(),o=a[0],s=a[1];if(o&&s){var c=o.split(`
`),l=s.split(`
`);for(i=r=0;r<c.length&&!c[r].includes(`DetermineComponentFrameRoot`);)r++;for(;i<l.length&&!l[i].includes(`DetermineComponentFrameRoot`);)i++;if(r===c.length||i===l.length)for(r=c.length-1,i=l.length-1;1<=r&&0<=i&&c[r]!==l[i];)i--;for(;1<=r&&0<=i;r--,i--)if(c[r]!==l[i]){if(r!==1||i!==1)do if(r--,i--,0>i||c[r]!==l[i]){var u=`
`+c[r].replace(` at new `,` at `);return e.displayName&&u.includes(`<anonymous>`)&&(u=u.replace(`<anonymous>`,e.displayName)),u}while(1<=r&&0<=i);break}}}finally{ue=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:``)?le(n):``}function fe(e,t){switch(e.tag){case 26:case 27:case 5:return le(e.type);case 16:return le(`Lazy`);case 13:return e.child!==t&&t!==null?le(`Suspense Fallback`):le(`Suspense`);case 19:return le(`SuspenseList`);case 0:case 15:return de(e.type,!1);case 11:return de(e.type.render,!1);case 1:return de(e.type,!0);case 31:return le(`Activity`);default:return``}}function pe(e){try{var t=``,n=null;do t+=fe(e,n),n=e,e=e.return;while(e);return t}catch(e){return`
Error generating stack: `+e.message+`
`+e.stack}}var me=Object.prototype.hasOwnProperty,he=t.unstable_scheduleCallback,ge=t.unstable_cancelCallback,_e=t.unstable_shouldYield,ve=t.unstable_requestPaint,ye=t.unstable_now,be=t.unstable_getCurrentPriorityLevel,xe=t.unstable_ImmediatePriority,Se=t.unstable_UserBlockingPriority,Ce=t.unstable_NormalPriority,we=t.unstable_LowPriority,Te=t.unstable_IdlePriority,G=t.log,Ee=t.unstable_setDisableYieldValue,De=null,Oe=null;function ke(e){if(typeof G==`function`&&Ee(e),Oe&&typeof Oe.setStrictMode==`function`)try{Oe.setStrictMode(De,e)}catch{}}var Ae=Math.clz32?Math.clz32:Ne,je=Math.log,Me=Math.LN2;function Ne(e){return e>>>=0,e===0?32:31-(je(e)/Me|0)|0}var Pe=256,Fe=262144,Ie=4194304;function Le(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&261888;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function Re(e,t,n){var r=e.pendingLanes;if(r===0)return 0;var i=0,a=e.suspendedLanes,o=e.pingedLanes;e=e.warmLanes;var s=r&134217727;return s===0?(s=r&~a,s===0?o===0?n||(n=r&~e,n!==0&&(i=Le(n))):i=Le(o):i=Le(s)):(r=s&~a,r===0?(o&=s,o===0?n||(n=s&~e,n!==0&&(i=Le(n))):i=Le(o)):i=Le(r)),i===0?0:t!==0&&t!==i&&(t&a)===0&&(a=i&-i,n=t&-t,a>=n||a===32&&n&4194048)?t:i}function ze(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function Be(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Ve(){var e=Ie;return Ie<<=1,!(Ie&62914560)&&(Ie=4194304),e}function He(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function Ue(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function We(e,t,n,r,i,a){var o=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var s=e.entanglements,c=e.expirationTimes,l=e.hiddenUpdates;for(n=o&~n;0<n;){var u=31-Ae(n),d=1<<u;s[u]=0,c[u]=-1;var f=l[u];if(f!==null)for(l[u]=null,u=0;u<f.length;u++){var p=f[u];p!==null&&(p.lane&=-536870913)}n&=~d}r!==0&&Ge(e,r,0),a!==0&&i===0&&e.tag!==0&&(e.suspendedLanes|=a&~(o&~t))}function Ge(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var r=31-Ae(t);e.entangledLanes|=t,e.entanglements[r]=e.entanglements[r]|1073741824|n&261930}function Ke(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-Ae(n),i=1<<r;i&t|e[r]&t&&(e[r]|=t),n&=~i}}function qe(e,t){var n=t&-t;return n=n&42?1:Je(n),(n&(e.suspendedLanes|t))===0?n:0}function Je(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Ye(e){return e&=-e,2<e?8<e?e&134217727?32:268435456:8:2}function Xe(){var e=I.p;return e===0?(e=window.event,e===void 0?32:vp(e.type)):e}function Ze(e,t){var n=I.p;try{return I.p=e,t()}finally{I.p=n}}var Qe=Math.random().toString(36).slice(2),$e=`__reactFiber$`+Qe,et=`__reactProps$`+Qe,tt=`__reactContainer$`+Qe,nt=`__reactEvents$`+Qe,rt=`__reactListeners$`+Qe,it=`__reactHandles$`+Qe,at=`__reactResources$`+Qe,ot=`__reactMarker$`+Qe;function st(e){delete e[$e],delete e[et],delete e[nt],delete e[rt],delete e[it]}function ct(e){var t=e[$e];if(t)return t;for(var n=e.parentNode;n;){if(t=n[tt]||n[$e]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=hf(e);e!==null;){if(n=e[$e])return n;e=hf(e)}return t}e=n,n=e.parentNode}return null}function lt(e){if(e=e[$e]||e[tt]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function ut(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(i(33))}function dt(e){var t=e[at];return t||=e[at]={hoistableStyles:new Map,hoistableScripts:new Map},t}function ft(e){e[ot]=!0}var pt=new Set,mt={};function ht(e,t){gt(e,t),gt(e+`Capture`,t)}function gt(e,t){for(mt[e]=t,e=0;e<t.length;e++)pt.add(t[e])}var _t=RegExp(`^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`),vt={},yt={};function bt(e){return me.call(yt,e)?!0:me.call(vt,e)?!1:_t.test(e)?yt[e]=!0:(vt[e]=!0,!1)}function xt(e,t,n){if(bt(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:e.removeAttribute(t);return;case`boolean`:var r=t.toLowerCase().slice(0,5);if(r!==`data-`&&r!==`aria-`){e.removeAttribute(t);return}}e.setAttribute(t,``+n)}}function St(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(t);return}e.setAttribute(t,``+n)}}function Ct(e,t,n,r){if(r===null)e.removeAttribute(n);else{switch(typeof r){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(n);return}e.setAttributeNS(t,n,``+r)}}function K(e){switch(typeof e){case`bigint`:case`boolean`:case`number`:case`string`:case`undefined`:return e;case`object`:return e;default:return``}}function wt(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()===`input`&&(t===`checkbox`||t===`radio`)}function Tt(e,t,n){var r=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&r!==void 0&&typeof r.get==`function`&&typeof r.set==`function`){var i=r.get,a=r.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(e){n=``+e,a.call(this,e)}}),Object.defineProperty(e,t,{enumerable:r.enumerable}),{getValue:function(){return n},setValue:function(e){n=``+e},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Et(e){if(!e._valueTracker){var t=wt(e)?`checked`:`value`;e._valueTracker=Tt(e,t,``+e[t])}}function Dt(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r=``;return e&&(r=wt(e)?e.checked?`true`:`false`:e.value),e=r,e===n?!1:(t.setValue(e),!0)}function Ot(e){if(e||=typeof document<`u`?document:void 0,e===void 0)return null;try{return e.activeElement||e.body}catch{return e.body}}var kt=/[\n"\\]/g;function At(e){return e.replace(kt,function(e){return`\\`+e.charCodeAt(0).toString(16)+` `})}function jt(e,t,n,r,i,a,o,s){e.name=``,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`?e.type=o:e.removeAttribute(`type`),t==null?o!==`submit`&&o!==`reset`||e.removeAttribute(`value`):o===`number`?(t===0&&e.value===``||e.value!=t)&&(e.value=``+K(t)):e.value!==``+K(t)&&(e.value=``+K(t)),t==null?n==null?r!=null&&e.removeAttribute(`value`):Nt(e,o,K(n)):Nt(e,o,K(t)),i==null&&a!=null&&(e.defaultChecked=!!a),i!=null&&(e.checked=i&&typeof i!=`function`&&typeof i!=`symbol`),s!=null&&typeof s!=`function`&&typeof s!=`symbol`&&typeof s!=`boolean`?e.name=``+K(s):e.removeAttribute(`name`)}function Mt(e,t,n,r,i,a,o,s){if(a!=null&&typeof a!=`function`&&typeof a!=`symbol`&&typeof a!=`boolean`&&(e.type=a),t!=null||n!=null){if(!(a!==`submit`&&a!==`reset`||t!=null)){Et(e);return}n=n==null?``:``+K(n),t=t==null?n:``+K(t),s||t===e.value||(e.value=t),e.defaultValue=t}r??=i,r=typeof r!=`function`&&typeof r!=`symbol`&&!!r,e.checked=s?e.checked:!!r,e.defaultChecked=!!r,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`&&(e.name=o),Et(e)}function Nt(e,t,n){t===`number`&&Ot(e.ownerDocument)===e||e.defaultValue===``+n||(e.defaultValue=``+n)}function Pt(e,t,n,r){if(e=e.options,t){t={};for(var i=0;i<n.length;i++)t[`$`+n[i]]=!0;for(n=0;n<e.length;n++)i=t.hasOwnProperty(`$`+e[n].value),e[n].selected!==i&&(e[n].selected=i),i&&r&&(e[n].defaultSelected=!0)}else{for(n=``+K(n),t=null,i=0;i<e.length;i++){if(e[i].value===n){e[i].selected=!0,r&&(e[i].defaultSelected=!0);return}t!==null||e[i].disabled||(t=e[i])}t!==null&&(t.selected=!0)}}function Ft(e,t,n){if(t!=null&&(t=``+K(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n==null?``:``+K(n)}function It(e,t,n,r){if(t==null){if(r!=null){if(n!=null)throw Error(i(92));if(ee(r)){if(1<r.length)throw Error(i(93));r=r[0]}n=r}n??=``,t=n}n=K(t),e.defaultValue=n,r=e.textContent,r===n&&r!==``&&r!==null&&(e.value=r),Et(e)}function Lt(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var Rt=new Set(`animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(` `));function zt(e,t,n){var r=t.indexOf(`--`)===0;n==null||typeof n==`boolean`||n===``?r?e.setProperty(t,``):t===`float`?e.cssFloat=``:e[t]=``:r?e.setProperty(t,n):typeof n!=`number`||n===0||Rt.has(t)?t===`float`?e.cssFloat=n:e[t]=(``+n).trim():e[t]=n+`px`}function Bt(e,t,n){if(t!=null&&typeof t!=`object`)throw Error(i(62));if(e=e.style,n!=null){for(var r in n)!n.hasOwnProperty(r)||t!=null&&t.hasOwnProperty(r)||(r.indexOf(`--`)===0?e.setProperty(r,``):r===`float`?e.cssFloat=``:e[r]=``);for(var a in t)r=t[a],t.hasOwnProperty(a)&&n[a]!==r&&zt(e,a,r)}else for(var o in t)t.hasOwnProperty(o)&&zt(e,o,t[o])}function Vt(e){if(e.indexOf(`-`)===-1)return!1;switch(e){case`annotation-xml`:case`color-profile`:case`font-face`:case`font-face-src`:case`font-face-uri`:case`font-face-format`:case`font-face-name`:case`missing-glyph`:return!1;default:return!0}}var Ht=new Map([[`acceptCharset`,`accept-charset`],[`htmlFor`,`for`],[`httpEquiv`,`http-equiv`],[`crossOrigin`,`crossorigin`],[`accentHeight`,`accent-height`],[`alignmentBaseline`,`alignment-baseline`],[`arabicForm`,`arabic-form`],[`baselineShift`,`baseline-shift`],[`capHeight`,`cap-height`],[`clipPath`,`clip-path`],[`clipRule`,`clip-rule`],[`colorInterpolation`,`color-interpolation`],[`colorInterpolationFilters`,`color-interpolation-filters`],[`colorProfile`,`color-profile`],[`colorRendering`,`color-rendering`],[`dominantBaseline`,`dominant-baseline`],[`enableBackground`,`enable-background`],[`fillOpacity`,`fill-opacity`],[`fillRule`,`fill-rule`],[`floodColor`,`flood-color`],[`floodOpacity`,`flood-opacity`],[`fontFamily`,`font-family`],[`fontSize`,`font-size`],[`fontSizeAdjust`,`font-size-adjust`],[`fontStretch`,`font-stretch`],[`fontStyle`,`font-style`],[`fontVariant`,`font-variant`],[`fontWeight`,`font-weight`],[`glyphName`,`glyph-name`],[`glyphOrientationHorizontal`,`glyph-orientation-horizontal`],[`glyphOrientationVertical`,`glyph-orientation-vertical`],[`horizAdvX`,`horiz-adv-x`],[`horizOriginX`,`horiz-origin-x`],[`imageRendering`,`image-rendering`],[`letterSpacing`,`letter-spacing`],[`lightingColor`,`lighting-color`],[`markerEnd`,`marker-end`],[`markerMid`,`marker-mid`],[`markerStart`,`marker-start`],[`overlinePosition`,`overline-position`],[`overlineThickness`,`overline-thickness`],[`paintOrder`,`paint-order`],[`panose-1`,`panose-1`],[`pointerEvents`,`pointer-events`],[`renderingIntent`,`rendering-intent`],[`shapeRendering`,`shape-rendering`],[`stopColor`,`stop-color`],[`stopOpacity`,`stop-opacity`],[`strikethroughPosition`,`strikethrough-position`],[`strikethroughThickness`,`strikethrough-thickness`],[`strokeDasharray`,`stroke-dasharray`],[`strokeDashoffset`,`stroke-dashoffset`],[`strokeLinecap`,`stroke-linecap`],[`strokeLinejoin`,`stroke-linejoin`],[`strokeMiterlimit`,`stroke-miterlimit`],[`strokeOpacity`,`stroke-opacity`],[`strokeWidth`,`stroke-width`],[`textAnchor`,`text-anchor`],[`textDecoration`,`text-decoration`],[`textRendering`,`text-rendering`],[`transformOrigin`,`transform-origin`],[`underlinePosition`,`underline-position`],[`underlineThickness`,`underline-thickness`],[`unicodeBidi`,`unicode-bidi`],[`unicodeRange`,`unicode-range`],[`unitsPerEm`,`units-per-em`],[`vAlphabetic`,`v-alphabetic`],[`vHanging`,`v-hanging`],[`vIdeographic`,`v-ideographic`],[`vMathematical`,`v-mathematical`],[`vectorEffect`,`vector-effect`],[`vertAdvY`,`vert-adv-y`],[`vertOriginX`,`vert-origin-x`],[`vertOriginY`,`vert-origin-y`],[`wordSpacing`,`word-spacing`],[`writingMode`,`writing-mode`],[`xmlnsXlink`,`xmlns:xlink`],[`xHeight`,`x-height`]]),Ut=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Wt(e){return Ut.test(``+e)?`javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`:e}function Gt(){}var Kt=null;function qt(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Jt=null,Yt=null;function Xt(e){var t=lt(e);if(t&&(e=t.stateNode)){var n=e[et]||null;a:switch(e=t.stateNode,t.type){case`input`:if(jt(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type===`radio`&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll(`input[name="`+At(``+t)+`"][type="radio"]`),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var a=r[et]||null;if(!a)throw Error(i(90));jt(r,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name)}}for(t=0;t<n.length;t++)r=n[t],r.form===e.form&&Dt(r)}break a;case`textarea`:Ft(e,n.value,n.defaultValue);break a;case`select`:t=n.value,t!=null&&Pt(e,!!n.multiple,t,!1)}}}var Zt=!1;function Qt(e,t,n){if(Zt)return e(t,n);Zt=!0;try{return e(t)}finally{if(Zt=!1,(Jt!==null||Yt!==null)&&(xu(),Jt&&(t=Jt,e=Yt,Yt=Jt=null,Xt(t),e)))for(t=0;t<e.length;t++)Xt(e[t])}}function $t(e,t){var n=e.stateNode;if(n===null)return null;var r=n[et]||null;if(r===null)return null;n=r[t];a:switch(t){case`onClick`:case`onClickCapture`:case`onDoubleClick`:case`onDoubleClickCapture`:case`onMouseDown`:case`onMouseDownCapture`:case`onMouseMove`:case`onMouseMoveCapture`:case`onMouseUp`:case`onMouseUpCapture`:case`onMouseEnter`:(r=!r.disabled)||(e=e.type,r=!(e===`button`||e===`input`||e===`select`||e===`textarea`)),e=!r;break a;default:e=!1}if(e)return null;if(n&&typeof n!=`function`)throw Error(i(231,t,typeof n));return n}var en=!(typeof window>`u`||window.document===void 0||window.document.createElement===void 0),tn=!1;if(en)try{var nn={};Object.defineProperty(nn,"passive",{get:function(){tn=!0}}),window.addEventListener(`test`,nn,nn),window.removeEventListener(`test`,nn,nn)}catch{tn=!1}var rn=null,an=null,on=null;function sn(){if(on)return on;var e,t=an,n=t.length,r,i=`value`in rn?rn.value:rn.textContent,a=i.length;for(e=0;e<n&&t[e]===i[e];e++);var o=n-e;for(r=1;r<=o&&t[n-r]===i[a-r];r++);return on=i.slice(e,1<r?1-r:void 0)}function cn(e){var t=e.keyCode;return`charCode`in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function ln(){return!0}function un(){return!1}function dn(e){function t(t,n,r,i,a){for(var o in this._reactName=t,this._targetInst=r,this.type=n,this.nativeEvent=i,this.target=a,this.currentTarget=null,e)e.hasOwnProperty(o)&&(t=e[o],this[o]=t?t(i):i[o]);return this.isDefaultPrevented=(i.defaultPrevented==null?!1===i.returnValue:i.defaultPrevented)?ln:un,this.isPropagationStopped=un,this}return h(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e&&(e.preventDefault?e.preventDefault():typeof e.returnValue!=`unknown`&&(e.returnValue=!1),this.isDefaultPrevented=ln)},stopPropagation:function(){var e=this.nativeEvent;e&&(e.stopPropagation?e.stopPropagation():typeof e.cancelBubble!=`unknown`&&(e.cancelBubble=!0),this.isPropagationStopped=ln)},persist:function(){},isPersistent:ln}),t}var fn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},pn=dn(fn),mn=h({},fn,{view:0,detail:0}),hn=dn(mn),gn,_n,vn,yn=h({},mn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:kn,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return`movementX`in e?e.movementX:(e!==vn&&(vn&&e.type===`mousemove`?(gn=e.screenX-vn.screenX,_n=e.screenY-vn.screenY):_n=gn=0,vn=e),gn)},movementY:function(e){return`movementY`in e?e.movementY:_n}}),bn=dn(yn),xn=dn(h({},yn,{dataTransfer:0})),Sn=dn(h({},mn,{relatedTarget:0})),Cn=dn(h({},fn,{animationName:0,elapsedTime:0,pseudoElement:0})),wn=dn(h({},fn,{clipboardData:function(e){return`clipboardData`in e?e.clipboardData:window.clipboardData}})),Tn=dn(h({},fn,{data:0})),En={Esc:`Escape`,Spacebar:` `,Left:`ArrowLeft`,Up:`ArrowUp`,Right:`ArrowRight`,Down:`ArrowDown`,Del:`Delete`,Win:`OS`,Menu:`ContextMenu`,Apps:`ContextMenu`,Scroll:`ScrollLock`,MozPrintableKey:`Unidentified`},q={8:`Backspace`,9:`Tab`,12:`Clear`,13:`Enter`,16:`Shift`,17:`Control`,18:`Alt`,19:`Pause`,20:`CapsLock`,27:`Escape`,32:` `,33:`PageUp`,34:`PageDown`,35:`End`,36:`Home`,37:`ArrowLeft`,38:`ArrowUp`,39:`ArrowRight`,40:`ArrowDown`,45:`Insert`,46:`Delete`,112:`F1`,113:`F2`,114:`F3`,115:`F4`,116:`F5`,117:`F6`,118:`F7`,119:`F8`,120:`F9`,121:`F10`,122:`F11`,123:`F12`,144:`NumLock`,145:`ScrollLock`,224:`Meta`},Dn={Alt:`altKey`,Control:`ctrlKey`,Meta:`metaKey`,Shift:`shiftKey`};function On(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=Dn[e])?!!t[e]:!1}function kn(){return On}var An=dn(h({},mn,{key:function(e){if(e.key){var t=En[e.key]||e.key;if(t!==`Unidentified`)return t}return e.type===`keypress`?(e=cn(e),e===13?`Enter`:String.fromCharCode(e)):e.type===`keydown`||e.type===`keyup`?q[e.keyCode]||`Unidentified`:``},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:kn,charCode:function(e){return e.type===`keypress`?cn(e):0},keyCode:function(e){return e.type===`keydown`||e.type===`keyup`?e.keyCode:0},which:function(e){return e.type===`keypress`?cn(e):e.type===`keydown`||e.type===`keyup`?e.keyCode:0}})),jn=dn(h({},yn,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0})),Mn=dn(h({},mn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:kn})),Nn=dn(h({},fn,{propertyName:0,elapsedTime:0,pseudoElement:0})),Pn=dn(h({},yn,{deltaX:function(e){return`deltaX`in e?e.deltaX:`wheelDeltaX`in e?-e.wheelDeltaX:0},deltaY:function(e){return`deltaY`in e?e.deltaY:`wheelDeltaY`in e?-e.wheelDeltaY:`wheelDelta`in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0})),Fn=dn(h({},fn,{newState:0,oldState:0})),In=[9,13,27,32],Ln=en&&`CompositionEvent`in window,Rn=null;en&&`documentMode`in document&&(Rn=document.documentMode);var zn=en&&`TextEvent`in window&&!Rn,Bn=en&&(!Ln||Rn&&8<Rn&&11>=Rn),Vn=` `,Hn=!1;function Un(e,t){switch(e){case`keyup`:return In.indexOf(t.keyCode)!==-1;case`keydown`:return t.keyCode!==229;case`keypress`:case`mousedown`:case`focusout`:return!0;default:return!1}}function Wn(e){return e=e.detail,typeof e==`object`&&`data`in e?e.data:null}var Gn=!1;function Kn(e,t){switch(e){case`compositionend`:return Wn(t);case`keypress`:return t.which===32?(Hn=!0,Vn):null;case`textInput`:return e=t.data,e===Vn&&Hn?null:e;default:return null}}function qn(e,t){if(Gn)return e===`compositionend`||!Ln&&Un(e,t)?(e=sn(),on=an=rn=null,Gn=!1,e):null;switch(e){case`paste`:return null;case`keypress`:if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case`compositionend`:return Bn&&t.locale!==`ko`?null:t.data;default:return null}}var Jn={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Yn(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t===`input`?!!Jn[e.type]:t===`textarea`}function Xn(e,t,n,r){Jt?Yt?Yt.push(r):Yt=[r]:Jt=r,t=kd(t,`onChange`),0<t.length&&(n=new pn(`onChange`,`change`,null,n,r),e.push({event:n,listeners:t}))}var Zn=null,Qn=null;function $n(e){xd(e,0)}function er(e){if(Dt(ut(e)))return e}function tr(e,t){if(e===`change`)return t}var nr=!1;if(en){var rr;if(en){var ir=`oninput`in document;if(!ir){var ar=document.createElement(`div`);ar.setAttribute(`oninput`,`return;`),ir=typeof ar.oninput==`function`}rr=ir}else rr=!1;nr=rr&&(!document.documentMode||9<document.documentMode)}function or(){Zn&&(Zn.detachEvent(`onpropertychange`,sr),Qn=Zn=null)}function sr(e){if(e.propertyName===`value`&&er(Qn)){var t=[];Xn(t,Qn,e,qt(e)),Qt($n,t)}}function cr(e,t,n){e===`focusin`?(or(),Zn=t,Qn=n,Zn.attachEvent(`onpropertychange`,sr)):e===`focusout`&&or()}function lr(e){if(e===`selectionchange`||e===`keyup`||e===`keydown`)return er(Qn)}function ur(e,t){if(e===`click`)return er(t)}function dr(e,t){if(e===`input`||e===`change`)return er(t)}function fr(e,t){return e===t&&(e!==0||1/e==1/t)||e!==e&&t!==t}var pr=typeof Object.is==`function`?Object.is:fr;function mr(e,t){if(pr(e,t))return!0;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var i=n[r];if(!me.call(t,i)||!pr(e[i],t[i]))return!1}return!0}function hr(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function gr(e,t){var n=hr(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}a:{for(;n;){if(n.nextSibling){n=n.nextSibling;break a}n=n.parentNode}n=void 0}n=hr(n)}}function _r(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?_r(e,t.parentNode):`contains`in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function vr(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=Ot(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href==`string`}catch{n=!1}if(n)e=t.contentWindow;else break;t=Ot(e.document)}return t}function yr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t===`input`&&(e.type===`text`||e.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var br=en&&`documentMode`in document&&11>=document.documentMode,xr=null,Sr=null,Cr=null,wr=!1;function Tr(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;wr||xr==null||xr!==Ot(r)||(r=xr,`selectionStart`in r&&yr(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Cr&&mr(Cr,r)||(Cr=r,r=kd(Sr,`onSelect`),0<r.length&&(t=new pn(`onSelect`,`select`,null,t,n),e.push({event:t,listeners:r}),t.target=xr)))}function Er(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n[`Webkit`+e]=`webkit`+t,n[`Moz`+e]=`moz`+t,n}var Dr={animationend:Er(`Animation`,`AnimationEnd`),animationiteration:Er(`Animation`,`AnimationIteration`),animationstart:Er(`Animation`,`AnimationStart`),transitionrun:Er(`Transition`,`TransitionRun`),transitionstart:Er(`Transition`,`TransitionStart`),transitioncancel:Er(`Transition`,`TransitionCancel`),transitionend:Er(`Transition`,`TransitionEnd`)},Or={},kr={};en&&(kr=document.createElement(`div`).style,`AnimationEvent`in window||(delete Dr.animationend.animation,delete Dr.animationiteration.animation,delete Dr.animationstart.animation),`TransitionEvent`in window||delete Dr.transitionend.transition);function Ar(e){if(Or[e])return Or[e];if(!Dr[e])return e;var t=Dr[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in kr)return Or[e]=t[n];return e}var jr=Ar(`animationend`),Mr=Ar(`animationiteration`),Nr=Ar(`animationstart`),Pr=Ar(`transitionrun`),Fr=Ar(`transitionstart`),Ir=Ar(`transitioncancel`),Lr=Ar(`transitionend`),Rr=new Map,zr=`abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(` `);zr.push(`scrollEnd`);function Br(e,t){Rr.set(e,t),ht(t,[e])}var Vr=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)},Hr=[],Ur=0,Wr=0;function Gr(){for(var e=Ur,t=Wr=Ur=0;t<e;){var n=Hr[t];Hr[t++]=null;var r=Hr[t];Hr[t++]=null;var i=Hr[t];Hr[t++]=null;var a=Hr[t];if(Hr[t++]=null,r!==null&&i!==null){var o=r.pending;o===null?i.next=i:(i.next=o.next,o.next=i),r.pending=i}a!==0&&Yr(n,i,a)}}function Kr(e,t,n,r){Hr[Ur++]=e,Hr[Ur++]=t,Hr[Ur++]=n,Hr[Ur++]=r,Wr|=r,e.lanes|=r,e=e.alternate,e!==null&&(e.lanes|=r)}function qr(e,t,n,r){return Kr(e,t,n,r),Xr(e)}function Jr(e,t){return Kr(e,null,null,t),Xr(e)}function Yr(e,t,n){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n);for(var i=!1,a=e.return;a!==null;)a.childLanes|=n,r=a.alternate,r!==null&&(r.childLanes|=n),a.tag===22&&(e=a.stateNode,e===null||e._visibility&1||(i=!0)),e=a,a=a.return;return e.tag===3?(a=e.stateNode,i&&t!==null&&(i=31-Ae(n),e=a.hiddenUpdates,r=e[i],r===null?e[i]=[t]:r.push(t),t.lane=n|536870912),a):null}function Xr(e){if(50<fu)throw fu=0,pu=null,Error(i(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Zr={};function Qr(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function $r(e,t,n,r){return new Qr(e,t,n,r)}function ei(e){return e=e.prototype,!(!e||!e.isReactComponent)}function ti(e,t){var n=e.alternate;return n===null?(n=$r(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&65011712,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function ni(e,t){e.flags&=65011714;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function ri(e,t,n,r,a,o){var s=0;if(r=e,typeof e==`function`)ei(e)&&(s=1);else if(typeof e==`string`)s=qf(e,n,V.current)?26:e===`html`||e===`head`||e===`body`?27:5;else a:switch(e){case k:return e=$r(31,n,t,a),e.elementType=k,e.lanes=o,e;case y:return ii(n.children,a,o,t);case b:s=8,a|=24;break;case x:return e=$r(12,n,t,a|2),e.elementType=x,e.lanes=o,e;case T:return e=$r(13,n,t,a),e.elementType=T,e.lanes=o,e;case E:return e=$r(19,n,t,a),e.elementType=E,e.lanes=o,e;default:if(typeof e==`object`&&e)switch(e.$$typeof){case C:s=10;break a;case S:s=9;break a;case w:s=11;break a;case D:s=14;break a;case O:s=16,r=null;break a}s=29,n=Error(i(130,e===null?`null`:typeof e,``)),r=null}return t=$r(s,n,t,a),t.elementType=e,t.type=r,t.lanes=o,t}function ii(e,t,n,r){return e=$r(7,e,r,t),e.lanes=n,e}function ai(e,t,n){return e=$r(6,e,null,t),e.lanes=n,e}function oi(e){var t=$r(18,null,null,0);return t.stateNode=e,t}function si(e,t,n){return t=$r(4,e.children===null?[]:e.children,e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var ci=new WeakMap;function li(e,t){if(typeof e==`object`&&e){var n=ci.get(e);return n===void 0?(t={value:e,source:t,stack:pe(t)},ci.set(e,t),t):n}return{value:e,source:t,stack:pe(t)}}var ui=[],di=0,fi=null,pi=0,mi=[],hi=0,gi=null,_i=1,vi=``;function yi(e,t){ui[di++]=pi,ui[di++]=fi,fi=e,pi=t}function bi(e,t,n){mi[hi++]=_i,mi[hi++]=vi,mi[hi++]=gi,gi=e;var r=_i;e=vi;var i=32-Ae(r)-1;r&=~(1<<i),n+=1;var a=32-Ae(t)+i;if(30<a){var o=i-i%5;a=(r&(1<<o)-1).toString(32),r>>=o,i-=o,_i=1<<32-Ae(t)+i|n<<i|r,vi=a+e}else _i=1<<a|n<<i|r,vi=e}function xi(e){e.return!==null&&(yi(e,1),bi(e,1,0))}function Si(e){for(;e===fi;)fi=ui[--di],ui[di]=null,pi=ui[--di],ui[di]=null;for(;e===gi;)gi=mi[--hi],mi[hi]=null,vi=mi[--hi],mi[hi]=null,_i=mi[--hi],mi[hi]=null}function Ci(e,t){mi[hi++]=_i,mi[hi++]=vi,mi[hi++]=gi,_i=t.id,vi=t.overflow,gi=e}var wi=null,Ti=null,J=!1,Ei=null,Di=!1,Oi=Error(i(519));function ki(e){throw Fi(li(Error(i(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?`text`:`HTML`,``)),e)),Oi}function Ai(e){var t=e.stateNode,n=e.type,r=e.memoizedProps;switch(t[$e]=e,t[et]=r,n){case`dialog`:Sd(`cancel`,t),Sd(`close`,t);break;case`iframe`:case`object`:case`embed`:Sd(`load`,t);break;case`video`:case`audio`:for(n=0;n<yd.length;n++)Sd(yd[n],t);break;case`source`:Sd(`error`,t);break;case`img`:case`image`:case`link`:Sd(`error`,t),Sd(`load`,t);break;case`details`:Sd(`toggle`,t);break;case`input`:Sd(`invalid`,t),Mt(t,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case`select`:Sd(`invalid`,t);break;case`textarea`:Sd(`invalid`,t),It(t,r.value,r.defaultValue,r.children)}n=r.children,typeof n!=`string`&&typeof n!=`number`&&typeof n!=`bigint`||t.textContent===``+n||!0===r.suppressHydrationWarning||Fd(t.textContent,n)?(r.popover!=null&&(Sd(`beforetoggle`,t),Sd(`toggle`,t)),r.onScroll!=null&&Sd(`scroll`,t),r.onScrollEnd!=null&&Sd(`scrollend`,t),r.onClick!=null&&(t.onclick=Gt),t=!0):t=!1,t||ki(e,!0)}function ji(e){for(wi=e.return;wi;)switch(wi.tag){case 5:case 31:case 13:Di=!1;return;case 27:case 3:Di=!0;return;default:wi=wi.return}}function Mi(e){if(e!==wi)return!1;if(!J)return ji(e),J=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=!(n!==`form`&&n!==`button`)||qd(e.type,e.memoizedProps)),n=!n),n&&Ti&&ki(e),ji(e),t===13){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));Ti=mf(e)}else if(t===31){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));Ti=mf(e)}else t===27?(t=Ti,tf(e.type)?(e=pf,pf=null,Ti=e):Ti=t):Ti=wi?ff(e.stateNode.nextSibling):null;return!0}function Ni(){Ti=wi=null,J=!1}function Pi(){var e=Ei;return e!==null&&(Ql===null?Ql=e:Ql.push.apply(Ql,e),Ei=null),e}function Fi(e){Ei===null?Ei=[e]:Ei.push(e)}var Ii=R(null),Li=null,Ri=null;function zi(e,t,n){B(Ii,t._currentValue),t._currentValue=n}function Bi(e){e._currentValue=Ii.current,z(Ii)}function Vi(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)===t?r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t):(e.childLanes|=t,r!==null&&(r.childLanes|=t)),e===n)break;e=e.return}}function Hi(e,t,n,r){var a=e.child;for(a!==null&&(a.return=e);a!==null;){var o=a.dependencies;if(o!==null){var s=a.child;o=o.firstContext;a:for(;o!==null;){var c=o;o=a;for(var l=0;l<t.length;l++)if(c.context===t[l]){o.lanes|=n,c=o.alternate,c!==null&&(c.lanes|=n),Vi(o.return,n,e),r||(s=null);break a}o=c.next}}else if(a.tag===18){if(s=a.return,s===null)throw Error(i(341));s.lanes|=n,o=s.alternate,o!==null&&(o.lanes|=n),Vi(s,n,e),s=null}else s=a.child;if(s!==null)s.return=a;else for(s=a;s!==null;){if(s===e){s=null;break}if(a=s.sibling,a!==null){a.return=s.return,s=a;break}s=s.return}a=s}}function Ui(e,t,n,r){e=null;for(var a=t,o=!1;a!==null;){if(!o){if(a.flags&524288)o=!0;else if(a.flags&262144)break}if(a.tag===10){var s=a.alternate;if(s===null)throw Error(i(387));if(s=s.memoizedProps,s!==null){var c=a.type;pr(a.pendingProps.value,s.value)||(e===null?e=[c]:e.push(c))}}else if(a===U.current){if(s=a.alternate,s===null)throw Error(i(387));s.memoizedState.memoizedState!==a.memoizedState.memoizedState&&(e===null?e=[np]:e.push(np))}a=a.return}e!==null&&Hi(t,e,n,r),t.flags|=262144}function Wi(e){for(e=e.firstContext;e!==null;){if(!pr(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Gi(e){Li=e,Ri=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Ki(e){return Ji(Li,e)}function qi(e,t){return Li===null&&Gi(e),Ji(e,t)}function Ji(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},Ri===null){if(e===null)throw Error(i(308));Ri=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Ri=Ri.next=t;return n}var Yi=typeof AbortController<`u`?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(t,n){e.push(n)}};this.abort=function(){t.aborted=!0,e.forEach(function(e){return e()})}},Xi=t.unstable_scheduleCallback,Zi=t.unstable_NormalPriority,Qi={$$typeof:C,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function $i(){return{controller:new Yi,data:new Map,refCount:0}}function ea(e){e.refCount--,e.refCount===0&&Xi(Zi,function(){e.controller.abort()})}var ta=null,na=0,ra=0,ia=null;function aa(e,t){if(ta===null){var n=ta=[];na=0,ra=pd(),ia={status:`pending`,value:void 0,then:function(e){n.push(e)}}}return na++,t.then(oa,oa),t}function oa(){if(--na===0&&ta!==null){ia!==null&&(ia.status=`fulfilled`);var e=ta;ta=null,ra=0,ia=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function sa(e,t){var n=[],r={status:`pending`,value:null,reason:null,then:function(e){n.push(e)}};return e.then(function(){r.status=`fulfilled`,r.value=t;for(var e=0;e<n.length;e++)(0,n[e])(t)},function(e){for(r.status=`rejected`,r.reason=e,e=0;e<n.length;e++)(0,n[e])(void 0)}),r}var ca=F.S;F.S=function(e,t){tu=ye(),typeof t==`object`&&t&&typeof t.then==`function`&&aa(e,t),ca!==null&&ca(e,t)};var la=R(null);function ua(){var e=la.current;return e===null?Il.pooledCache:e}function da(e,t){t===null?B(la,la.current):B(la,t.pool)}function fa(){var e=ua();return e===null?null:{parent:Qi._currentValue,pool:e}}var pa=Error(i(460)),ma=Error(i(474)),ha=Error(i(542)),ga={then:function(){}};function _a(e){return e=e.status,e===`fulfilled`||e===`rejected`}function va(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(Gt,Gt),t=n),t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,Sa(e),e;default:if(typeof t.status==`string`)t.then(Gt,Gt);else{if(e=Il,e!==null&&100<e.shellSuspendCounter)throw Error(i(482));e=t,e.status=`pending`,e.then(function(e){if(t.status===`pending`){var n=t;n.status=`fulfilled`,n.value=e}},function(e){if(t.status===`pending`){var n=t;n.status=`rejected`,n.reason=e}})}switch(t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,Sa(e),e}throw ba=t,pa}}function ya(e){try{var t=e._init;return t(e._payload)}catch(e){throw typeof e==`object`&&e&&typeof e.then==`function`?(ba=e,pa):e}}var ba=null;function xa(){if(ba===null)throw Error(i(459));var e=ba;return ba=null,e}function Sa(e){if(e===pa||e===ha)throw Error(i(483))}var Ca=null,wa=0;function Ta(e){var t=wa;return wa+=1,Ca===null&&(Ca=[]),va(Ca,e,t)}function Ea(e,t){t=t.props.ref,e.ref=t===void 0?null:t}function Da(e,t){throw t.$$typeof===g?Error(i(525)):(e=Object.prototype.toString.call(t),Error(i(31,e===`[object Object]`?`object with keys {`+Object.keys(t).join(`, `)+`}`:e)))}function Oa(e){function t(t,n){if(e){var r=t.deletions;r===null?(t.deletions=[n],t.flags|=16):r.push(n)}}function n(n,r){if(!e)return null;for(;r!==null;)t(n,r),r=r.sibling;return null}function r(e){for(var t=new Map;e!==null;)e.key===null?t.set(e.index,e):t.set(e.key,e),e=e.sibling;return t}function a(e,t){return e=ti(e,t),e.index=0,e.sibling=null,e}function o(t,n,r){return t.index=r,e?(r=t.alternate,r===null?(t.flags|=67108866,n):(r=r.index,r<n?(t.flags|=67108866,n):r)):(t.flags|=1048576,n)}function s(t){return e&&t.alternate===null&&(t.flags|=67108866),t}function c(e,t,n,r){return t===null||t.tag!==6?(t=ai(n,e.mode,r),t.return=e,t):(t=a(t,n),t.return=e,t)}function l(e,t,n,r){var i=n.type;return i===y?d(e,t,n.props.children,r,n.key):t!==null&&(t.elementType===i||typeof i==`object`&&i&&i.$$typeof===O&&ya(i)===t.type)?(t=a(t,n.props),Ea(t,n),t.return=e,t):(t=ri(n.type,n.key,n.props,null,e.mode,r),Ea(t,n),t.return=e,t)}function u(e,t,n,r){return t===null||t.tag!==4||t.stateNode.containerInfo!==n.containerInfo||t.stateNode.implementation!==n.implementation?(t=si(n,e.mode,r),t.return=e,t):(t=a(t,n.children||[]),t.return=e,t)}function d(e,t,n,r,i){return t===null||t.tag!==7?(t=ii(n,e.mode,r,i),t.return=e,t):(t=a(t,n),t.return=e,t)}function f(e,t,n){if(typeof t==`string`&&t!==``||typeof t==`number`||typeof t==`bigint`)return t=ai(``+t,e.mode,n),t.return=e,t;if(typeof t==`object`&&t){switch(t.$$typeof){case _:return n=ri(t.type,t.key,t.props,null,e.mode,n),Ea(n,t),n.return=e,n;case v:return t=si(t,e.mode,n),t.return=e,t;case O:return t=ya(t),f(e,t,n)}if(ee(t)||M(t))return t=ii(t,e.mode,n,null),t.return=e,t;if(typeof t.then==`function`)return f(e,Ta(t),n);if(t.$$typeof===C)return f(e,qi(e,t),n);Da(e,t)}return null}function p(e,t,n,r){var i=t===null?null:t.key;if(typeof n==`string`&&n!==``||typeof n==`number`||typeof n==`bigint`)return i===null?c(e,t,``+n,r):null;if(typeof n==`object`&&n){switch(n.$$typeof){case _:return n.key===i?l(e,t,n,r):null;case v:return n.key===i?u(e,t,n,r):null;case O:return n=ya(n),p(e,t,n,r)}if(ee(n)||M(n))return i===null?d(e,t,n,r,null):null;if(typeof n.then==`function`)return p(e,t,Ta(n),r);if(n.$$typeof===C)return p(e,t,qi(e,n),r);Da(e,n)}return null}function m(e,t,n,r,i){if(typeof r==`string`&&r!==``||typeof r==`number`||typeof r==`bigint`)return e=e.get(n)||null,c(t,e,``+r,i);if(typeof r==`object`&&r){switch(r.$$typeof){case _:return e=e.get(r.key===null?n:r.key)||null,l(t,e,r,i);case v:return e=e.get(r.key===null?n:r.key)||null,u(t,e,r,i);case O:return r=ya(r),m(e,t,n,r,i)}if(ee(r)||M(r))return e=e.get(n)||null,d(t,e,r,i,null);if(typeof r.then==`function`)return m(e,t,n,Ta(r),i);if(r.$$typeof===C)return m(e,t,n,qi(t,r),i);Da(t,r)}return null}function h(i,a,s,c){for(var l=null,u=null,d=a,h=a=0,g=null;d!==null&&h<s.length;h++){d.index>h?(g=d,d=null):g=d.sibling;var _=p(i,d,s[h],c);if(_===null){d===null&&(d=g);break}e&&d&&_.alternate===null&&t(i,d),a=o(_,a,h),u===null?l=_:u.sibling=_,u=_,d=g}if(h===s.length)return n(i,d),J&&yi(i,h),l;if(d===null){for(;h<s.length;h++)d=f(i,s[h],c),d!==null&&(a=o(d,a,h),u===null?l=d:u.sibling=d,u=d);return J&&yi(i,h),l}for(d=r(d);h<s.length;h++)g=m(d,i,h,s[h],c),g!==null&&(e&&g.alternate!==null&&d.delete(g.key===null?h:g.key),a=o(g,a,h),u===null?l=g:u.sibling=g,u=g);return e&&d.forEach(function(e){return t(i,e)}),J&&yi(i,h),l}function g(a,s,c,l){if(c==null)throw Error(i(151));for(var u=null,d=null,h=s,g=s=0,_=null,v=c.next();h!==null&&!v.done;g++,v=c.next()){h.index>g?(_=h,h=null):_=h.sibling;var y=p(a,h,v.value,l);if(y===null){h===null&&(h=_);break}e&&h&&y.alternate===null&&t(a,h),s=o(y,s,g),d===null?u=y:d.sibling=y,d=y,h=_}if(v.done)return n(a,h),J&&yi(a,g),u;if(h===null){for(;!v.done;g++,v=c.next())v=f(a,v.value,l),v!==null&&(s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return J&&yi(a,g),u}for(h=r(h);!v.done;g++,v=c.next())v=m(h,a,g,v.value,l),v!==null&&(e&&v.alternate!==null&&h.delete(v.key===null?g:v.key),s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return e&&h.forEach(function(e){return t(a,e)}),J&&yi(a,g),u}function b(e,r,o,c){if(typeof o==`object`&&o&&o.type===y&&o.key===null&&(o=o.props.children),typeof o==`object`&&o){switch(o.$$typeof){case _:a:{for(var l=o.key;r!==null;){if(r.key===l){if(l=o.type,l===y){if(r.tag===7){n(e,r.sibling),c=a(r,o.props.children),c.return=e,e=c;break a}}else if(r.elementType===l||typeof l==`object`&&l&&l.$$typeof===O&&ya(l)===r.type){n(e,r.sibling),c=a(r,o.props),Ea(c,o),c.return=e,e=c;break a}n(e,r);break}else t(e,r);r=r.sibling}o.type===y?(c=ii(o.props.children,e.mode,c,o.key),c.return=e,e=c):(c=ri(o.type,o.key,o.props,null,e.mode,c),Ea(c,o),c.return=e,e=c)}return s(e);case v:a:{for(l=o.key;r!==null;){if(r.key===l)if(r.tag===4&&r.stateNode.containerInfo===o.containerInfo&&r.stateNode.implementation===o.implementation){n(e,r.sibling),c=a(r,o.children||[]),c.return=e,e=c;break a}else{n(e,r);break}else t(e,r);r=r.sibling}c=si(o,e.mode,c),c.return=e,e=c}return s(e);case O:return o=ya(o),b(e,r,o,c)}if(ee(o))return h(e,r,o,c);if(M(o)){if(l=M(o),typeof l!=`function`)throw Error(i(150));return o=l.call(o),g(e,r,o,c)}if(typeof o.then==`function`)return b(e,r,Ta(o),c);if(o.$$typeof===C)return b(e,r,qi(e,o),c);Da(e,o)}return typeof o==`string`&&o!==``||typeof o==`number`||typeof o==`bigint`?(o=``+o,r!==null&&r.tag===6?(n(e,r.sibling),c=a(r,o),c.return=e,e=c):(n(e,r),c=ai(o,e.mode,c),c.return=e,e=c),s(e)):n(e,r)}return function(e,t,n,r){try{wa=0;var i=b(e,t,n,r);return Ca=null,i}catch(t){if(t===pa||t===ha)throw t;var a=$r(29,t,null,e.mode);return a.lanes=r,a.return=e,a}}}var ka=Oa(!0),Aa=Oa(!1),ja=!1;function Ma(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Na(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Pa(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Fa(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,Fl&2){var i=r.pending;return i===null?t.next=t:(t.next=i.next,i.next=t),r.pending=t,t=Xr(e),Yr(e,null,n),t}return Kr(e,r,t,n),Xr(e)}function Ia(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,n&4194048)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Ke(e,n)}}function La(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var i=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var o={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};a===null?i=a=o:a=a.next=o,n=n.next}while(n!==null);a===null?i=a=t:a=a.next=t}else i=a=t;n={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:a,shared:r.shared,callbacks:r.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var Ra=!1;function za(){if(Ra){var e=ia;if(e!==null)throw e}}function Ba(e,t,n,r){Ra=!1;var i=e.updateQueue;ja=!1;var a=i.firstBaseUpdate,o=i.lastBaseUpdate,s=i.shared.pending;if(s!==null){i.shared.pending=null;var c=s,l=c.next;c.next=null,o===null?a=l:o.next=l,o=c;var u=e.alternate;u!==null&&(u=u.updateQueue,s=u.lastBaseUpdate,s!==o&&(s===null?u.firstBaseUpdate=l:s.next=l,u.lastBaseUpdate=c))}if(a!==null){var d=i.baseState;o=0,u=l=c=null,s=a;do{var f=s.lane&-536870913,p=f!==s.lane;if(p?(Rl&f)===f:(r&f)===f){f!==0&&f===ra&&(Ra=!0),u!==null&&(u=u.next={lane:0,tag:s.tag,payload:s.payload,callback:null,next:null});a:{var m=e,g=s;f=t;var _=n;switch(g.tag){case 1:if(m=g.payload,typeof m==`function`){d=m.call(_,d,f);break a}d=m;break a;case 3:m.flags=m.flags&-65537|128;case 0:if(m=g.payload,f=typeof m==`function`?m.call(_,d,f):m,f==null)break a;d=h({},d,f);break a;case 2:ja=!0}}f=s.callback,f!==null&&(e.flags|=64,p&&(e.flags|=8192),p=i.callbacks,p===null?i.callbacks=[f]:p.push(f))}else p={lane:f,tag:s.tag,payload:s.payload,callback:s.callback,next:null},u===null?(l=u=p,c=d):u=u.next=p,o|=f;if(s=s.next,s===null){if(s=i.shared.pending,s===null)break;p=s,s=p.next,p.next=null,i.lastBaseUpdate=p,i.shared.pending=null}}while(1);u===null&&(c=d),i.baseState=c,i.firstBaseUpdate=l,i.lastBaseUpdate=u,a===null&&(i.shared.lanes=0),Kl|=o,e.lanes=o,e.memoizedState=d}}function Va(e,t){if(typeof e!=`function`)throw Error(i(191,e));e.call(t)}function Ha(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)Va(n[e],t)}var Ua=R(null),Wa=R(0);function Ga(e,t){e=Wl,B(Wa,e),B(Ua,t),Wl=e|t.baseLanes}function Ka(){B(Wa,Wl),B(Ua,Ua.current)}function qa(){Wl=Wa.current,z(Ua),z(Wa)}var Ja=R(null),Ya=null;function Xa(e){var t=e.alternate;B(to,to.current&1),B(Ja,e),Ya===null&&(t===null||Ua.current!==null||t.memoizedState!==null)&&(Ya=e)}function Za(e){B(to,to.current),B(Ja,e),Ya===null&&(Ya=e)}function Qa(e){e.tag===22?(B(to,to.current),B(Ja,e),Ya===null&&(Ya=e)):$a(e)}function $a(){B(to,to.current),B(Ja,Ja.current)}function eo(e){z(Ja),Ya===e&&(Ya=null),z(to)}var to=R(0);function no(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||lf(n)||uf(n)))return t}else if(t.tag===19&&(t.memoizedProps.revealOrder===`forwards`||t.memoizedProps.revealOrder===`backwards`||t.memoizedProps.revealOrder===`unstable_legacy-backwards`||t.memoizedProps.revealOrder===`together`)){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var ro=0,Y=null,io=null,ao=null,oo=!1,so=!1,co=!1,lo=0,uo=0,fo=null,po=0;function mo(){throw Error(i(321))}function ho(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!pr(e[n],t[n]))return!1;return!0}function go(e,t,n,r,i,a){return ro=a,Y=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,F.H=e===null||e.memoizedState===null?Ns:Ps,co=!1,a=n(r,i),co=!1,so&&(a=vo(t,n,r,i)),_o(e),a}function _o(e){F.H=Ms;var t=io!==null&&io.next!==null;if(ro=0,ao=io=Y=null,oo=!1,uo=0,fo=null,t)throw Error(i(300));e===null||Zs||(e=e.dependencies,e!==null&&Wi(e)&&(Zs=!0))}function vo(e,t,n,r){Y=e;var a=0;do{if(so&&(fo=null),uo=0,so=!1,25<=a)throw Error(i(301));if(a+=1,ao=io=null,e.updateQueue!=null){var o=e.updateQueue;o.lastEffect=null,o.events=null,o.stores=null,o.memoCache!=null&&(o.memoCache.index=0)}F.H=Fs,o=t(n,r)}while(so);return o}function yo(){var e=F.H,t=e.useState()[0];return t=typeof t.then==`function`?Eo(t):t,e=e.useState()[0],(io===null?null:io.memoizedState)!==e&&(Y.flags|=1024),t}function bo(){var e=lo!==0;return lo=0,e}function xo(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function So(e){if(oo){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}oo=!1}ro=0,ao=io=Y=null,so=!1,uo=lo=0,fo=null}function Co(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return ao===null?Y.memoizedState=ao=e:ao=ao.next=e,ao}function wo(){if(io===null){var e=Y.alternate;e=e===null?null:e.memoizedState}else e=io.next;var t=ao===null?Y.memoizedState:ao.next;if(t!==null)ao=t,io=e;else{if(e===null)throw Y.alternate===null?Error(i(467)):Error(i(310));io=e,e={memoizedState:io.memoizedState,baseState:io.baseState,baseQueue:io.baseQueue,queue:io.queue,next:null},ao===null?Y.memoizedState=ao=e:ao=ao.next=e}return ao}function To(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function Eo(e){var t=uo;return uo+=1,fo===null&&(fo=[]),e=va(fo,e,t),t=Y,(ao===null?t.memoizedState:ao.next)===null&&(t=t.alternate,F.H=t===null||t.memoizedState===null?Ns:Ps),e}function Do(e){if(typeof e==`object`&&e){if(typeof e.then==`function`)return Eo(e);if(e.$$typeof===C)return Ki(e)}throw Error(i(438,String(e)))}function Oo(e){var t=null,n=Y.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var r=Y.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(t={data:r.data.map(function(e){return e.slice()}),index:0})))}if(t??={data:[],index:0},n===null&&(n=To(),Y.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),r=0;r<e;r++)n[r]=A;return t.index++,n}function ko(e,t){return typeof t==`function`?t(e):t}function Ao(e){return jo(wo(),io,e)}function jo(e,t,n){var r=e.queue;if(r===null)throw Error(i(311));r.lastRenderedReducer=n;var a=e.baseQueue,o=r.pending;if(o!==null){if(a!==null){var s=a.next;a.next=o.next,o.next=s}t.baseQueue=a=o,r.pending=null}if(o=e.baseState,a===null)e.memoizedState=o;else{t=a.next;var c=s=null,l=null,u=t,d=!1;do{var f=u.lane&-536870913;if(f===u.lane?(ro&f)===f:(Rl&f)===f){var p=u.revertLane;if(p===0)l!==null&&(l=l.next={lane:0,revertLane:0,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),f===ra&&(d=!0);else if((ro&p)===p){u=u.next,p===ra&&(d=!0);continue}else f={lane:0,revertLane:u.revertLane,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=f,s=o):l=l.next=f,Y.lanes|=p,Kl|=p;f=u.action,co&&n(o,f),o=u.hasEagerState?u.eagerState:n(o,f)}else p={lane:f,revertLane:u.revertLane,gesture:u.gesture,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=p,s=o):l=l.next=p,Y.lanes|=f,Kl|=f;u=u.next}while(u!==null&&u!==t);if(l===null?s=o:l.next=c,!pr(o,e.memoizedState)&&(Zs=!0,d&&(n=ia,n!==null)))throw n;e.memoizedState=o,e.baseState=s,e.baseQueue=l,r.lastRenderedState=o}return a===null&&(r.lanes=0),[e.memoizedState,r.dispatch]}function Mo(e){var t=wo(),n=t.queue;if(n===null)throw Error(i(311));n.lastRenderedReducer=e;var r=n.dispatch,a=n.pending,o=t.memoizedState;if(a!==null){n.pending=null;var s=a=a.next;do o=e(o,s.action),s=s.next;while(s!==a);pr(o,t.memoizedState)||(Zs=!0),t.memoizedState=o,t.baseQueue===null&&(t.baseState=o),n.lastRenderedState=o}return[o,r]}function No(e,t,n){var r=Y,a=wo(),o=J;if(o){if(n===void 0)throw Error(i(407));n=n()}else n=t();var s=!pr((io||a).memoizedState,n);if(s&&(a.memoizedState=n,Zs=!0),a=a.queue,is(Io.bind(null,r,a,e),[e]),a.getSnapshot!==t||s||ao!==null&&ao.memoizedState.tag&1){if(r.flags|=2048,$o(9,{destroy:void 0},Fo.bind(null,r,a,n,t),null),Il===null)throw Error(i(349));o||ro&127||Po(r,t,n)}return n}function Po(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=Y.updateQueue,t===null?(t=To(),Y.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Fo(e,t,n,r){t.value=n,t.getSnapshot=r,Lo(t)&&Ro(e)}function Io(e,t,n){return n(function(){Lo(t)&&Ro(e)})}function Lo(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!pr(e,n)}catch{return!0}}function Ro(e){var t=Jr(e,2);t!==null&&gu(t,e,2)}function zo(e){var t=Co();if(typeof e==`function`){var n=e;if(e=n(),co){ke(!0);try{n()}finally{ke(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:ko,lastRenderedState:e},t}function Bo(e,t,n,r){return e.baseState=n,jo(e,io,typeof r==`function`?r:ko)}function Vo(e,t,n,r,a){if(ks(e))throw Error(i(485));if(e=t.action,e!==null){var o={payload:a,action:e,next:null,isTransition:!0,status:`pending`,value:null,reason:null,listeners:[],then:function(e){o.listeners.push(e)}};F.T===null?o.isTransition=!1:n(!0),r(o),n=t.pending,n===null?(o.next=t.pending=o,Ho(t,o)):(o.next=n.next,t.pending=n.next=o)}}function Ho(e,t){var n=t.action,r=t.payload,i=e.state;if(t.isTransition){var a=F.T,o={};F.T=o;try{var s=n(i,r),c=F.S;c!==null&&c(o,s),Uo(e,t,s)}catch(n){Go(e,t,n)}finally{a!==null&&o.types!==null&&(a.types=o.types),F.T=a}}else try{a=n(i,r),Uo(e,t,a)}catch(n){Go(e,t,n)}}function Uo(e,t,n){typeof n==`object`&&n&&typeof n.then==`function`?n.then(function(n){Wo(e,t,n)},function(n){return Go(e,t,n)}):Wo(e,t,n)}function Wo(e,t,n){t.status=`fulfilled`,t.value=n,Ko(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,Ho(e,n)))}function Go(e,t,n){var r=e.pending;if(e.pending=null,r!==null){r=r.next;do t.status=`rejected`,t.reason=n,Ko(t),t=t.next;while(t!==r)}e.action=null}function Ko(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function qo(e,t){return t}function Jo(e,t){if(J){var n=Il.formState;if(n!==null){a:{var r=Y;if(J){if(Ti){b:{for(var i=Ti,a=Di;i.nodeType!==8;){if(!a){i=null;break b}if(i=ff(i.nextSibling),i===null){i=null;break b}}a=i.data,i=a===`F!`||a===`F`?i:null}if(i){Ti=ff(i.nextSibling),r=i.data===`F!`;break a}}ki(r)}r=!1}r&&(t=n[0])}}return n=Co(),n.memoizedState=n.baseState=t,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:qo,lastRenderedState:t},n.queue=r,n=Es.bind(null,Y,r),r.dispatch=n,r=zo(!1),a=Os.bind(null,Y,!1,r.queue),r=Co(),i={state:t,dispatch:null,action:e,pending:null},r.queue=i,n=Vo.bind(null,Y,i,a,n),i.dispatch=n,r.memoizedState=e,[t,n,!1]}function Yo(e){return Xo(wo(),io,e)}function Xo(e,t,n){if(t=jo(e,t,qo)[0],e=Ao(ko)[0],typeof t==`object`&&t&&typeof t.then==`function`)try{var r=Eo(t)}catch(e){throw e===pa?ha:e}else r=t;t=wo();var i=t.queue,a=i.dispatch;return n!==t.memoizedState&&(Y.flags|=2048,$o(9,{destroy:void 0},Zo.bind(null,i,n),null)),[r,a,e]}function Zo(e,t){e.action=t}function Qo(e){var t=wo(),n=io;if(n!==null)return Xo(t,n,e);wo(),t=t.memoizedState,n=wo();var r=n.queue.dispatch;return n.memoizedState=e,[t,r,!1]}function $o(e,t,n,r){return e={tag:e,create:n,deps:r,inst:t,next:null},t=Y.updateQueue,t===null&&(t=To(),Y.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e),e}function es(){return wo().memoizedState}function ts(e,t,n,r){var i=Co();Y.flags|=e,i.memoizedState=$o(1|t,{destroy:void 0},n,r===void 0?null:r)}function ns(e,t,n,r){var i=wo();r=r===void 0?null:r;var a=i.memoizedState.inst;io!==null&&r!==null&&ho(r,io.memoizedState.deps)?i.memoizedState=$o(t,a,n,r):(Y.flags|=e,i.memoizedState=$o(1|t,a,n,r))}function rs(e,t){ts(8390656,8,e,t)}function is(e,t){ns(2048,8,e,t)}function as(e){Y.flags|=4;var t=Y.updateQueue;if(t===null)t=To(),Y.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function os(e){var t=wo().memoizedState;return as({ref:t,nextImpl:e}),function(){if(Fl&2)throw Error(i(440));return t.impl.apply(void 0,arguments)}}function ss(e,t){return ns(4,2,e,t)}function cs(e,t){return ns(4,4,e,t)}function ls(e,t){if(typeof t==`function`){e=e();var n=t(e);return function(){typeof n==`function`?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function us(e,t,n){n=n==null?null:n.concat([e]),ns(4,4,ls.bind(null,t,e),n)}function ds(){}function fs(e,t){var n=wo();t=t===void 0?null:t;var r=n.memoizedState;return t!==null&&ho(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function ps(e,t){var n=wo();t=t===void 0?null:t;var r=n.memoizedState;if(t!==null&&ho(t,r[1]))return r[0];if(r=e(),co){ke(!0);try{e()}finally{ke(!1)}}return n.memoizedState=[r,t],r}function ms(e,t,n){return n===void 0||ro&1073741824&&!(Rl&261930)?e.memoizedState=t:(e.memoizedState=n,e=hu(),Y.lanes|=e,Kl|=e,n)}function hs(e,t,n,r){return pr(n,t)?n:Ua.current===null?!(ro&42)||ro&1073741824&&!(Rl&261930)?(Zs=!0,e.memoizedState=n):(e=hu(),Y.lanes|=e,Kl|=e,t):(e=ms(e,n,r),pr(e,t)||(Zs=!0),e)}function gs(e,t,n,r,i){var a=I.p;I.p=a!==0&&8>a?a:8;var o=F.T,s={};F.T=s,Os(e,!1,t,n);try{var c=i(),l=F.S;l!==null&&l(s,c),typeof c==`object`&&c&&typeof c.then==`function`?Ds(e,t,sa(c,r),mu(e)):Ds(e,t,r,mu(e))}catch(n){Ds(e,t,{then:function(){},status:`rejected`,reason:n},mu())}finally{I.p=a,o!==null&&s.types!==null&&(o.types=s.types),F.T=o}}function _s(){}function vs(e,t,n,r){if(e.tag!==5)throw Error(i(476));var a=ys(e).queue;gs(e,a,t,te,n===null?_s:function(){return bs(e),n(r)})}function ys(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:te,baseState:te,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ko,lastRenderedState:te},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ko,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function bs(e){var t=ys(e);t.next===null&&(t=e.alternate.memoizedState),Ds(e,t.next.queue,{},mu())}function xs(){return Ki(np)}function Ss(){return wo().memoizedState}function Cs(){return wo().memoizedState}function ws(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=mu();e=Pa(n);var r=Fa(t,e,n);r!==null&&(gu(r,t,n),Ia(r,t,n)),t={cache:$i()},e.payload=t;return}t=t.return}}function Ts(e,t,n){var r=mu();n={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},ks(e)?As(t,n):(n=qr(e,t,n,r),n!==null&&(gu(n,e,r),js(n,t,r)))}function Es(e,t,n){Ds(e,t,n,mu())}function Ds(e,t,n,r){var i={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(ks(e))As(t,i);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,s=a(o,n);if(i.hasEagerState=!0,i.eagerState=s,pr(s,o))return Kr(e,t,i,0),Il===null&&Gr(),!1}catch{}if(n=qr(e,t,i,r),n!==null)return gu(n,e,r),js(n,t,r),!0}return!1}function Os(e,t,n,r){if(r={lane:2,revertLane:pd(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},ks(e)){if(t)throw Error(i(479))}else t=qr(e,n,r,2),t!==null&&gu(t,e,2)}function ks(e){var t=e.alternate;return e===Y||t!==null&&t===Y}function As(e,t){so=oo=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function js(e,t,n){if(n&4194048){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Ke(e,n)}}var Ms={readContext:Ki,use:Do,useCallback:mo,useContext:mo,useEffect:mo,useImperativeHandle:mo,useLayoutEffect:mo,useInsertionEffect:mo,useMemo:mo,useReducer:mo,useRef:mo,useState:mo,useDebugValue:mo,useDeferredValue:mo,useTransition:mo,useSyncExternalStore:mo,useId:mo,useHostTransitionStatus:mo,useFormState:mo,useActionState:mo,useOptimistic:mo,useMemoCache:mo,useCacheRefresh:mo};Ms.useEffectEvent=mo;var Ns={readContext:Ki,use:Do,useCallback:function(e,t){return Co().memoizedState=[e,t===void 0?null:t],e},useContext:Ki,useEffect:rs,useImperativeHandle:function(e,t,n){n=n==null?null:n.concat([e]),ts(4194308,4,ls.bind(null,t,e),n)},useLayoutEffect:function(e,t){return ts(4194308,4,e,t)},useInsertionEffect:function(e,t){ts(4,2,e,t)},useMemo:function(e,t){var n=Co();t=t===void 0?null:t;var r=e();if(co){ke(!0);try{e()}finally{ke(!1)}}return n.memoizedState=[r,t],r},useReducer:function(e,t,n){var r=Co();if(n!==void 0){var i=n(t);if(co){ke(!0);try{n(t)}finally{ke(!1)}}}else i=t;return r.memoizedState=r.baseState=i,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:i},r.queue=e,e=e.dispatch=Ts.bind(null,Y,e),[r.memoizedState,e]},useRef:function(e){var t=Co();return e={current:e},t.memoizedState=e},useState:function(e){e=zo(e);var t=e.queue,n=Es.bind(null,Y,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:ds,useDeferredValue:function(e,t){return ms(Co(),e,t)},useTransition:function(){var e=zo(!1);return e=gs.bind(null,Y,e.queue,!0,!1),Co().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var r=Y,a=Co();if(J){if(n===void 0)throw Error(i(407));n=n()}else{if(n=t(),Il===null)throw Error(i(349));Rl&127||Po(r,t,n)}a.memoizedState=n;var o={value:n,getSnapshot:t};return a.queue=o,rs(Io.bind(null,r,o,e),[e]),r.flags|=2048,$o(9,{destroy:void 0},Fo.bind(null,r,o,n,t),null),n},useId:function(){var e=Co(),t=Il.identifierPrefix;if(J){var n=vi,r=_i;n=(r&~(1<<32-Ae(r)-1)).toString(32)+n,t=`_`+t+`R_`+n,n=lo++,0<n&&(t+=`H`+n.toString(32)),t+=`_`}else n=po++,t=`_`+t+`r_`+n.toString(32)+`_`;return e.memoizedState=t},useHostTransitionStatus:xs,useFormState:Jo,useActionState:Jo,useOptimistic:function(e){var t=Co();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=Os.bind(null,Y,!0,n),n.dispatch=t,[e,t]},useMemoCache:Oo,useCacheRefresh:function(){return Co().memoizedState=ws.bind(null,Y)},useEffectEvent:function(e){var t=Co(),n={impl:e};return t.memoizedState=n,function(){if(Fl&2)throw Error(i(440));return n.impl.apply(void 0,arguments)}}},Ps={readContext:Ki,use:Do,useCallback:fs,useContext:Ki,useEffect:is,useImperativeHandle:us,useInsertionEffect:ss,useLayoutEffect:cs,useMemo:ps,useReducer:Ao,useRef:es,useState:function(){return Ao(ko)},useDebugValue:ds,useDeferredValue:function(e,t){return hs(wo(),io.memoizedState,e,t)},useTransition:function(){var e=Ao(ko)[0],t=wo().memoizedState;return[typeof e==`boolean`?e:Eo(e),t]},useSyncExternalStore:No,useId:Ss,useHostTransitionStatus:xs,useFormState:Yo,useActionState:Yo,useOptimistic:function(e,t){return Bo(wo(),io,e,t)},useMemoCache:Oo,useCacheRefresh:Cs};Ps.useEffectEvent=os;var Fs={readContext:Ki,use:Do,useCallback:fs,useContext:Ki,useEffect:is,useImperativeHandle:us,useInsertionEffect:ss,useLayoutEffect:cs,useMemo:ps,useReducer:Mo,useRef:es,useState:function(){return Mo(ko)},useDebugValue:ds,useDeferredValue:function(e,t){var n=wo();return io===null?ms(n,e,t):hs(n,io.memoizedState,e,t)},useTransition:function(){var e=Mo(ko)[0],t=wo().memoizedState;return[typeof e==`boolean`?e:Eo(e),t]},useSyncExternalStore:No,useId:Ss,useHostTransitionStatus:xs,useFormState:Qo,useActionState:Qo,useOptimistic:function(e,t){var n=wo();return io===null?(n.baseState=e,[e,n.queue.dispatch]):Bo(n,io,e,t)},useMemoCache:Oo,useCacheRefresh:Cs};Fs.useEffectEvent=os;function Is(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:h({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Ls={enqueueSetState:function(e,t,n){e=e._reactInternals;var r=mu(),i=Pa(r);i.payload=t,n!=null&&(i.callback=n),t=Fa(e,i,r),t!==null&&(gu(t,e,r),Ia(t,e,r))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=mu(),i=Pa(r);i.tag=1,i.payload=t,n!=null&&(i.callback=n),t=Fa(e,i,r),t!==null&&(gu(t,e,r),Ia(t,e,r))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=mu(),r=Pa(n);r.tag=2,t!=null&&(r.callback=t),t=Fa(e,r,n),t!==null&&(gu(t,e,n),Ia(t,e,n))}};function Rs(e,t,n,r,i,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate==`function`?e.shouldComponentUpdate(r,a,o):t.prototype&&t.prototype.isPureReactComponent?!mr(n,r)||!mr(i,a):!0}function zs(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps==`function`&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps==`function`&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&Ls.enqueueReplaceState(t,t.state,null)}function Bs(e,t){var n=t;if(`ref`in t)for(var r in n={},t)r!==`ref`&&(n[r]=t[r]);if(e=e.defaultProps)for(var i in n===t&&(n=h({},n)),e)n[i]===void 0&&(n[i]=e[i]);return n}function Vs(e){Vr(e)}function Hs(e){console.error(e)}function Us(e){Vr(e)}function Ws(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(e){setTimeout(function(){throw e})}}function Gs(e,t,n){try{var r=e.onCaughtError;r(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(e){setTimeout(function(){throw e})}}function Ks(e,t,n){return n=Pa(n),n.tag=3,n.payload={element:null},n.callback=function(){Ws(e,t)},n}function qs(e){return e=Pa(e),e.tag=3,e}function Js(e,t,n,r){var i=n.type.getDerivedStateFromError;if(typeof i==`function`){var a=r.value;e.payload=function(){return i(a)},e.callback=function(){Gs(t,n,r)}}var o=n.stateNode;o!==null&&typeof o.componentDidCatch==`function`&&(e.callback=function(){Gs(t,n,r),typeof i!=`function`&&(iu===null?iu=new Set([this]):iu.add(this));var e=r.stack;this.componentDidCatch(r.value,{componentStack:e===null?``:e})})}function Ys(e,t,n,r,a){if(n.flags|=32768,typeof r==`object`&&r&&typeof r.then==`function`){if(t=n.alternate,t!==null&&Ui(t,n,a,!0),n=Ja.current,n!==null){switch(n.tag){case 31:case 13:return Ya===null?Ou():n.alternate===null&&Gl===0&&(Gl=3),n.flags&=-257,n.flags|=65536,n.lanes=a,r===ga?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([r]):t.add(r),qu(e,r,a)),!1;case 22:return n.flags|=65536,r===ga?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([r])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([r]):n.add(r)),qu(e,r,a)),!1}throw Error(i(435,n.tag))}return qu(e,r,a),Ou(),!1}if(J)return t=Ja.current,t===null?(r!==Oi&&(t=Error(i(423),{cause:r}),Fi(li(t,n))),e=e.current.alternate,e.flags|=65536,a&=-a,e.lanes|=a,r=li(r,n),a=Ks(e.stateNode,r,a),La(e,a),Gl!==4&&(Gl=2)):(!(t.flags&65536)&&(t.flags|=256),t.flags|=65536,t.lanes=a,r!==Oi&&(e=Error(i(422),{cause:r}),Fi(li(e,n)))),!1;var o=Error(i(520),{cause:r});if(o=li(o,n),Zl===null?Zl=[o]:Zl.push(o),Gl!==4&&(Gl=2),t===null)return!0;r=li(r,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=a&-a,n.lanes|=e,e=Ks(n.stateNode,r,e),La(n,e),!1;case 1:if(t=n.type,o=n.stateNode,!(n.flags&128)&&(typeof t.getDerivedStateFromError==`function`||o!==null&&typeof o.componentDidCatch==`function`&&(iu===null||!iu.has(o))))return n.flags|=65536,a&=-a,n.lanes|=a,a=qs(a),Js(a,e,n,r),La(n,a),!1}n=n.return}while(n!==null);return!1}var Xs=Error(i(461)),Zs=!1;function Qs(e,t,n,r){t.child=e===null?Aa(t,null,n,r):ka(t,e.child,n,r)}function $s(e,t,n,r,i){n=n.render;var a=t.ref;if(`ref`in r){var o={};for(var s in r)s!==`ref`&&(o[s]=r[s])}else o=r;return Gi(t),r=go(e,t,n,o,a,i),s=bo(),e!==null&&!Zs?(xo(e,t,i),Cc(e,t,i)):(J&&s&&xi(t),t.flags|=1,Qs(e,t,r,i),t.child)}function ec(e,t,n,r,i){if(e===null){var a=n.type;return typeof a==`function`&&!ei(a)&&a.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=a,tc(e,t,a,r,i)):(e=ri(n.type,null,r,t,t.mode,i),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,!wc(e,i)){var o=a.memoizedProps;if(n=n.compare,n=n===null?mr:n,n(o,r)&&e.ref===t.ref)return Cc(e,t,i)}return t.flags|=1,e=ti(a,r),e.ref=t.ref,e.return=t,t.child=e}function tc(e,t,n,r,i){if(e!==null){var a=e.memoizedProps;if(mr(a,r)&&e.ref===t.ref)if(Zs=!1,t.pendingProps=r=a,wc(e,i))e.flags&131072&&(Zs=!0);else return t.lanes=e.lanes,Cc(e,t,i)}return lc(e,t,n,r,i)}function nc(e,t,n,r){var i=r.children,a=e===null?null:e.memoizedState;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode===`hidden`){if(t.flags&128){if(a=a===null?n:a.baseLanes|n,e!==null){for(r=t.child=e.child,i=0;r!==null;)i=i|r.lanes|r.childLanes,r=r.sibling;r=i&~a}else r=0,t.child=null;return ic(e,t,a,n,r)}if(n&536870912)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&da(t,a===null?null:a.cachePool),a===null?Ka():Ga(t,a),Qa(t);else return r=t.lanes=536870912,ic(e,t,a===null?n:a.baseLanes|n,n,r)}else a===null?(e!==null&&da(t,null),Ka(),$a(t)):(da(t,a.cachePool),Ga(t,a),$a(t),t.memoizedState=null);return Qs(e,t,i,n),t.child}function rc(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function ic(e,t,n,r,i){var a=ua();return a=a===null?null:{parent:Qi._currentValue,pool:a},t.memoizedState={baseLanes:n,cachePool:a},e!==null&&da(t,null),Ka(),Qa(t),e!==null&&Ui(e,t,r,!0),t.childLanes=i,null}function ac(e,t){return t=vc({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function oc(e,t,n){return ka(t,e.child,null,n),e=ac(t,t.pendingProps),e.flags|=2,eo(t),t.memoizedState=null,e}function sc(e,t,n){var r=t.pendingProps,a=(t.flags&128)!=0;if(t.flags&=-129,e===null){if(J){if(r.mode===`hidden`)return e=ac(t,r),t.lanes=536870912,rc(null,e);if(Za(t),(e=Ti)?(e=cf(e,Di),e=e!==null&&e.data===`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:gi===null?null:{id:_i,overflow:vi},retryLane:536870912,hydrationErrors:null},n=oi(e),n.return=t,t.child=n,wi=t,Ti=null)):e=null,e===null)throw ki(t);return t.lanes=536870912,null}return ac(t,r)}var o=e.memoizedState;if(o!==null){var s=o.dehydrated;if(Za(t),a)if(t.flags&256)t.flags&=-257,t=oc(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(i(558));else if(Zs||Ui(e,t,n,!1),a=(n&e.childLanes)!==0,Zs||a){if(r=Il,r!==null&&(s=qe(r,n),s!==0&&s!==o.retryLane))throw o.retryLane=s,Jr(e,s),gu(r,e,s),Xs;Ou(),t=oc(e,t,n)}else e=o.treeContext,Ti=ff(s.nextSibling),wi=t,J=!0,Ei=null,Di=!1,e!==null&&Ci(t,e),t=ac(t,r),t.flags|=4096;return t}return e=ti(e.child,{mode:r.mode,children:r.children}),e.ref=t.ref,t.child=e,e.return=t,e}function cc(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!=`function`&&typeof n!=`object`)throw Error(i(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function lc(e,t,n,r,i){return Gi(t),n=go(e,t,n,r,void 0,i),r=bo(),e!==null&&!Zs?(xo(e,t,i),Cc(e,t,i)):(J&&r&&xi(t),t.flags|=1,Qs(e,t,n,i),t.child)}function uc(e,t,n,r,i,a){return Gi(t),t.updateQueue=null,n=vo(t,r,n,i),_o(e),r=bo(),e!==null&&!Zs?(xo(e,t,a),Cc(e,t,a)):(J&&r&&xi(t),t.flags|=1,Qs(e,t,n,a),t.child)}function dc(e,t,n,r,i){if(Gi(t),t.stateNode===null){var a=Zr,o=n.contextType;typeof o==`object`&&o&&(a=Ki(o)),a=new n(r,a),t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,a.updater=Ls,t.stateNode=a,a._reactInternals=t,a=t.stateNode,a.props=r,a.state=t.memoizedState,a.refs={},Ma(t),o=n.contextType,a.context=typeof o==`object`&&o?Ki(o):Zr,a.state=t.memoizedState,o=n.getDerivedStateFromProps,typeof o==`function`&&(Is(t,n,o,r),a.state=t.memoizedState),typeof n.getDerivedStateFromProps==`function`||typeof a.getSnapshotBeforeUpdate==`function`||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(o=a.state,typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount(),o!==a.state&&Ls.enqueueReplaceState(a,a.state,null),Ba(t,r,a,i),za(),a.state=t.memoizedState),typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!0}else if(e===null){a=t.stateNode;var s=t.memoizedProps,c=Bs(n,s);a.props=c;var l=a.context,u=n.contextType;o=Zr,typeof u==`object`&&u&&(o=Ki(u));var d=n.getDerivedStateFromProps;u=typeof d==`function`||typeof a.getSnapshotBeforeUpdate==`function`,s=t.pendingProps!==s,u||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(s||l!==o)&&zs(t,a,r,o),ja=!1;var f=t.memoizedState;a.state=f,Ba(t,r,a,i),za(),l=t.memoizedState,s||f!==l||ja?(typeof d==`function`&&(Is(t,n,d,r),l=t.memoizedState),(c=ja||Rs(t,n,c,r,f,l,o))?(u||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount==`function`&&(t.flags|=4194308)):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=l),a.props=r,a.state=l,a.context=o,r=c):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!1)}else{a=t.stateNode,Na(e,t),o=t.memoizedProps,u=Bs(n,o),a.props=u,d=t.pendingProps,f=a.context,l=n.contextType,c=Zr,typeof l==`object`&&l&&(c=Ki(l)),s=n.getDerivedStateFromProps,(l=typeof s==`function`||typeof a.getSnapshotBeforeUpdate==`function`)||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(o!==d||f!==c)&&zs(t,a,r,c),ja=!1,f=t.memoizedState,a.state=f,Ba(t,r,a,i),za();var p=t.memoizedState;o!==d||f!==p||ja||e!==null&&e.dependencies!==null&&Wi(e.dependencies)?(typeof s==`function`&&(Is(t,n,s,r),p=t.memoizedState),(u=ja||Rs(t,n,u,r,f,p,c)||e!==null&&e.dependencies!==null&&Wi(e.dependencies))?(l||typeof a.UNSAFE_componentWillUpdate!=`function`&&typeof a.componentWillUpdate!=`function`||(typeof a.componentWillUpdate==`function`&&a.componentWillUpdate(r,p,c),typeof a.UNSAFE_componentWillUpdate==`function`&&a.UNSAFE_componentWillUpdate(r,p,c)),typeof a.componentDidUpdate==`function`&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate==`function`&&(t.flags|=1024)):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=p),a.props=r,a.state=p,a.context=c,r=u):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),r=!1)}return a=r,cc(e,t),r=(t.flags&128)!=0,a||r?(a=t.stateNode,n=r&&typeof n.getDerivedStateFromError!=`function`?null:a.render(),t.flags|=1,e!==null&&r?(t.child=ka(t,e.child,null,i),t.child=ka(t,null,n,i)):Qs(e,t,n,i),t.memoizedState=a.state,e=t.child):e=Cc(e,t,i),e}function fc(e,t,n,r){return Ni(),t.flags|=256,Qs(e,t,n,r),t.child}var pc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function mc(e){return{baseLanes:e,cachePool:fa()}}function hc(e,t,n){return e=e===null?0:e.childLanes&~n,t&&(e|=Yl),e}function gc(e,t,n){var r=t.pendingProps,a=!1,o=(t.flags&128)!=0,s;if((s=o)||(s=e!==null&&e.memoizedState===null?!1:(to.current&2)!=0),s&&(a=!0,t.flags&=-129),s=(t.flags&32)!=0,t.flags&=-33,e===null){if(J){if(a?Xa(t):$a(t),(e=Ti)?(e=cf(e,Di),e=e!==null&&e.data!==`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:gi===null?null:{id:_i,overflow:vi},retryLane:536870912,hydrationErrors:null},n=oi(e),n.return=t,t.child=n,wi=t,Ti=null)):e=null,e===null)throw ki(t);return uf(e)?t.lanes=32:t.lanes=536870912,null}var c=r.children;return r=r.fallback,a?($a(t),a=t.mode,c=vc({mode:`hidden`,children:c},a),r=ii(r,a,n,null),c.return=t,r.return=t,c.sibling=r,t.child=c,r=t.child,r.memoizedState=mc(n),r.childLanes=hc(e,s,n),t.memoizedState=pc,rc(null,r)):(Xa(t),_c(t,c))}var l=e.memoizedState;if(l!==null&&(c=l.dehydrated,c!==null)){if(o)t.flags&256?(Xa(t),t.flags&=-257,t=yc(e,t,n)):t.memoizedState===null?($a(t),c=r.fallback,a=t.mode,r=vc({mode:`visible`,children:r.children},a),c=ii(c,a,n,null),c.flags|=2,r.return=t,c.return=t,r.sibling=c,t.child=r,ka(t,e.child,null,n),r=t.child,r.memoizedState=mc(n),r.childLanes=hc(e,s,n),t.memoizedState=pc,t=rc(null,r)):($a(t),t.child=e.child,t.flags|=128,t=null);else if(Xa(t),uf(c)){if(s=c.nextSibling&&c.nextSibling.dataset,s)var u=s.dgst;s=u,r=Error(i(419)),r.stack=``,r.digest=s,Fi({value:r,source:null,stack:null}),t=yc(e,t,n)}else if(Zs||Ui(e,t,n,!1),s=(n&e.childLanes)!==0,Zs||s){if(s=Il,s!==null&&(r=qe(s,n),r!==0&&r!==l.retryLane))throw l.retryLane=r,Jr(e,r),gu(s,e,r),Xs;lf(c)||Ou(),t=yc(e,t,n)}else lf(c)?(t.flags|=192,t.child=e.child,t=null):(e=l.treeContext,Ti=ff(c.nextSibling),wi=t,J=!0,Ei=null,Di=!1,e!==null&&Ci(t,e),t=_c(t,r.children),t.flags|=4096);return t}return a?($a(t),c=r.fallback,a=t.mode,l=e.child,u=l.sibling,r=ti(l,{mode:`hidden`,children:r.children}),r.subtreeFlags=l.subtreeFlags&65011712,u===null?(c=ii(c,a,n,null),c.flags|=2):c=ti(u,c),c.return=t,r.return=t,r.sibling=c,t.child=r,rc(null,r),r=t.child,c=e.child.memoizedState,c===null?c=mc(n):(a=c.cachePool,a===null?a=fa():(l=Qi._currentValue,a=a.parent===l?a:{parent:l,pool:l}),c={baseLanes:c.baseLanes|n,cachePool:a}),r.memoizedState=c,r.childLanes=hc(e,s,n),t.memoizedState=pc,rc(e.child,r)):(Xa(t),n=e.child,e=n.sibling,n=ti(n,{mode:`visible`,children:r.children}),n.return=t,n.sibling=null,e!==null&&(s=t.deletions,s===null?(t.deletions=[e],t.flags|=16):s.push(e)),t.child=n,t.memoizedState=null,n)}function _c(e,t){return t=vc({mode:`visible`,children:t},e.mode),t.return=e,e.child=t}function vc(e,t){return e=$r(22,e,null,t),e.lanes=0,e}function yc(e,t,n){return ka(t,e.child,null,n),e=_c(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function bc(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Vi(e.return,t,n)}function xc(e,t,n,r,i,a){var o=e.memoizedState;o===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:i,treeForkCount:a}:(o.isBackwards=t,o.rendering=null,o.renderingStartTime=0,o.last=r,o.tail=n,o.tailMode=i,o.treeForkCount=a)}function Sc(e,t,n){var r=t.pendingProps,i=r.revealOrder,a=r.tail;r=r.children;var o=to.current,s=(o&2)!=0;if(s?(o=o&1|2,t.flags|=128):o&=1,B(to,o),Qs(e,t,r,n),r=J?pi:0,!s&&e!==null&&e.flags&128)a:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&bc(e,n,t);else if(e.tag===19)bc(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break a;for(;e.sibling===null;){if(e.return===null||e.return===t)break a;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(i){case`forwards`:for(n=t.child,i=null;n!==null;)e=n.alternate,e!==null&&no(e)===null&&(i=n),n=n.sibling;n=i,n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null),xc(t,!1,i,n,a,r);break;case`backwards`:case`unstable_legacy-backwards`:for(n=null,i=t.child,t.child=null;i!==null;){if(e=i.alternate,e!==null&&no(e)===null){t.child=i;break}e=i.sibling,i.sibling=n,n=i,i=e}xc(t,!0,n,null,a,r);break;case`together`:xc(t,!1,null,null,void 0,r);break;default:t.memoizedState=null}return t.child}function Cc(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Kl|=t.lanes,(n&t.childLanes)===0)if(e!==null){if(Ui(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(i(153));if(t.child!==null){for(e=t.child,n=ti(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=ti(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function wc(e,t){return(e.lanes&t)===0?(e=e.dependencies,!!(e!==null&&Wi(e))):!0}function Tc(e,t,n){switch(t.tag){case 3:ie(t,t.stateNode.containerInfo),zi(t,Qi,e.memoizedState.cache),Ni();break;case 27:case 5:oe(t);break;case 4:ie(t,t.stateNode.containerInfo);break;case 10:zi(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,Za(t),null;break;case 13:var r=t.memoizedState;if(r!==null)return r.dehydrated===null?(n&t.child.childLanes)===0?(Xa(t),e=Cc(e,t,n),e===null?null:e.sibling):gc(e,t,n):(Xa(t),t.flags|=128,null);Xa(t);break;case 19:var i=(e.flags&128)!=0;if(r=(n&t.childLanes)!==0,r||=(Ui(e,t,n,!1),(n&t.childLanes)!==0),i){if(r)return Sc(e,t,n);t.flags|=128}if(i=t.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),B(to,to.current),r)break;return null;case 22:return t.lanes=0,nc(e,t,n,t.pendingProps);case 24:zi(t,Qi,e.memoizedState.cache)}return Cc(e,t,n)}function Ec(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)Zs=!0;else{if(!wc(e,n)&&!(t.flags&128))return Zs=!1,Tc(e,t,n);Zs=!!(e.flags&131072)}else Zs=!1,J&&t.flags&1048576&&bi(t,pi,t.index);switch(t.lanes=0,t.tag){case 16:a:{var r=t.pendingProps;if(e=ya(t.elementType),t.type=e,typeof e==`function`)ei(e)?(r=Bs(e,r),t.tag=1,t=dc(null,t,e,r,n)):(t.tag=0,t=lc(null,t,e,r,n));else{if(e!=null){var a=e.$$typeof;if(a===w){t.tag=11,t=$s(null,t,e,r,n);break a}else if(a===D){t.tag=14,t=ec(null,t,e,r,n);break a}}throw t=P(e)||e,Error(i(306,t,``))}}return t;case 0:return lc(e,t,t.type,t.pendingProps,n);case 1:return r=t.type,a=Bs(r,t.pendingProps),dc(e,t,r,a,n);case 3:a:{if(ie(t,t.stateNode.containerInfo),e===null)throw Error(i(387));r=t.pendingProps;var o=t.memoizedState;a=o.element,Na(e,t),Ba(t,r,null,n);var s=t.memoizedState;if(r=s.cache,zi(t,Qi,r),r!==o.cache&&Hi(t,[Qi],n,!0),za(),r=s.element,o.isDehydrated)if(o={element:r,isDehydrated:!1,cache:s.cache},t.updateQueue.baseState=o,t.memoizedState=o,t.flags&256){t=fc(e,t,r,n);break a}else if(r!==a){a=li(Error(i(424)),t),Fi(a),t=fc(e,t,r,n);break a}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName===`HTML`?e.ownerDocument.body:e}for(Ti=ff(e.firstChild),wi=t,J=!0,Ei=null,Di=!0,n=Aa(t,null,r,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling}else{if(Ni(),r===a){t=Cc(e,t,n);break a}Qs(e,t,r,n)}t=t.child}return t;case 26:return cc(e,t),e===null?(n=Nf(t.type,null,t.pendingProps,null))?t.memoizedState=n:J||(n=t.type,e=t.pendingProps,r=Wd(H.current).createElement(n),r[$e]=t,r[et]=e,Rd(r,n,e),ft(r),t.stateNode=r):t.memoizedState=Nf(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return oe(t),e===null&&J&&(r=t.stateNode=gf(t.type,t.pendingProps,H.current),wi=t,Di=!0,a=Ti,tf(t.type)?(pf=a,Ti=ff(r.firstChild)):Ti=a),Qs(e,t,t.pendingProps.children,n),cc(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&J&&((a=r=Ti)&&(r=of(r,t.type,t.pendingProps,Di),r===null?a=!1:(t.stateNode=r,wi=t,Ti=ff(r.firstChild),Di=!1,a=!0)),a||ki(t)),oe(t),a=t.type,o=t.pendingProps,s=e===null?null:e.memoizedProps,r=o.children,qd(a,o)?r=null:s!==null&&qd(a,s)&&(t.flags|=32),t.memoizedState!==null&&(a=go(e,t,yo,null,null,n),np._currentValue=a),cc(e,t),Qs(e,t,r,n),t.child;case 6:return e===null&&J&&((e=n=Ti)&&(n=sf(n,t.pendingProps,Di),n===null?e=!1:(t.stateNode=n,wi=t,Ti=null,e=!0)),e||ki(t)),null;case 13:return gc(e,t,n);case 4:return ie(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=ka(t,null,r,n):Qs(e,t,r,n),t.child;case 11:return $s(e,t,t.type,t.pendingProps,n);case 7:return Qs(e,t,t.pendingProps,n),t.child;case 8:return Qs(e,t,t.pendingProps.children,n),t.child;case 12:return Qs(e,t,t.pendingProps.children,n),t.child;case 10:return r=t.pendingProps,zi(t,t.type,r.value),Qs(e,t,r.children,n),t.child;case 9:return a=t.type._context,r=t.pendingProps.children,Gi(t),a=Ki(a),r=r(a),t.flags|=1,Qs(e,t,r,n),t.child;case 14:return ec(e,t,t.type,t.pendingProps,n);case 15:return tc(e,t,t.type,t.pendingProps,n);case 19:return Sc(e,t,n);case 31:return sc(e,t,n);case 22:return nc(e,t,n,t.pendingProps);case 24:return Gi(t),r=Ki(Qi),e===null?(a=ua(),a===null&&(a=Il,o=$i(),a.pooledCache=o,o.refCount++,o!==null&&(a.pooledCacheLanes|=n),a=o),t.memoizedState={parent:r,cache:a},Ma(t),zi(t,Qi,a)):((e.lanes&n)!==0&&(Na(e,t),Ba(t,null,null,n),za()),a=e.memoizedState,o=t.memoizedState,a.parent===r?(r=o.cache,zi(t,Qi,r),r!==a.cache&&Hi(t,[Qi],n,!0)):(a={parent:r,cache:r},t.memoizedState=a,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=a),zi(t,Qi,r))),Qs(e,t,t.pendingProps.children,n),t.child;case 29:throw t.pendingProps}throw Error(i(156,t.tag))}function Dc(e){e.flags|=4}function Oc(e,t,n,r,i){if((t=(e.mode&32)!=0)&&(t=!1),t){if(e.flags|=16777216,(i&335544128)===i)if(e.stateNode.complete)e.flags|=8192;else if(Tu())e.flags|=8192;else throw ba=ga,ma}else e.flags&=-16777217}function kc(e,t){if(t.type!==`stylesheet`||t.state.loading&4)e.flags&=-16777217;else if(e.flags|=16777216,!Jf(t))if(Tu())e.flags|=8192;else throw ba=ga,ma}function Ac(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag===22?536870912:Ve(),e.lanes|=t,Xl|=t)}function jc(e,t){if(!J)switch(e.tailMode){case`hidden`:t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case`collapsed`:n=e.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function Mc(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags&65011712,r|=i.flags&65011712,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function Nc(e,t,n){var r=t.pendingProps;switch(Si(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Mc(t),null;case 1:return Mc(t),null;case 3:return n=t.stateNode,r=null,e!==null&&(r=e.memoizedState.cache),t.memoizedState.cache!==r&&(t.flags|=2048),Bi(Qi),ae(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(Mi(t)?Dc(t):e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,Pi())),Mc(t),null;case 26:var a=t.type,o=t.memoizedState;return e===null?(Dc(t),o===null?(Mc(t),Oc(t,a,null,r,n)):(Mc(t),kc(t,o))):o?o===e.memoizedState?(Mc(t),t.flags&=-16777217):(Dc(t),Mc(t),kc(t,o)):(e=e.memoizedProps,e!==r&&Dc(t),Mc(t),Oc(t,a,e,r,n)),null;case 27:if(W(t),n=H.current,a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&Dc(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return Mc(t),null}e=V.current,Mi(t)?Ai(t,e):(e=gf(a,r,n),t.stateNode=e,Dc(t))}return Mc(t),null;case 5:if(W(t),a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&Dc(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return Mc(t),null}if(o=V.current,Mi(t))Ai(t,o);else{var s=Wd(H.current);switch(o){case 1:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case 2:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;default:switch(a){case`svg`:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case`math`:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;case`script`:o=s.createElement(`div`),o.innerHTML=`<script><\/script>`,o=o.removeChild(o.firstChild);break;case`select`:o=typeof r.is==`string`?s.createElement(`select`,{is:r.is}):s.createElement(`select`),r.multiple?o.multiple=!0:r.size&&(o.size=r.size);break;default:o=typeof r.is==`string`?s.createElement(a,{is:r.is}):s.createElement(a)}}o[$e]=t,o[et]=r;a:for(s=t.child;s!==null;){if(s.tag===5||s.tag===6)o.appendChild(s.stateNode);else if(s.tag!==4&&s.tag!==27&&s.child!==null){s.child.return=s,s=s.child;continue}if(s===t)break a;for(;s.sibling===null;){if(s.return===null||s.return===t)break a;s=s.return}s.sibling.return=s.return,s=s.sibling}t.stateNode=o;a:switch(Rd(o,a,r),a){case`button`:case`input`:case`select`:case`textarea`:r=!!r.autoFocus;break a;case`img`:r=!0;break a;default:r=!1}r&&Dc(t)}}return Mc(t),Oc(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==r&&Dc(t);else{if(typeof r!=`string`&&t.stateNode===null)throw Error(i(166));if(e=H.current,Mi(t)){if(e=t.stateNode,n=t.memoizedProps,r=null,a=wi,a!==null)switch(a.tag){case 27:case 5:r=a.memoizedProps}e[$e]=t,e=!!(e.nodeValue===n||r!==null&&!0===r.suppressHydrationWarning||Fd(e.nodeValue,n)),e||ki(t,!0)}else e=Wd(e).createTextNode(r),e[$e]=t,t.stateNode=e}return Mc(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(r=Mi(t),n!==null){if(e===null){if(!r)throw Error(i(318));if(e=t.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(557));e[$e]=t}else Ni(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;Mc(t),e=!1}else n=Pi(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(eo(t),t):(eo(t),null);if(t.flags&128)throw Error(i(558))}return Mc(t),null;case 13:if(r=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(a=Mi(t),r!==null&&r.dehydrated!==null){if(e===null){if(!a)throw Error(i(318));if(a=t.memoizedState,a=a===null?null:a.dehydrated,!a)throw Error(i(317));a[$e]=t}else Ni(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;Mc(t),a=!1}else a=Pi(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=a),a=!0;if(!a)return t.flags&256?(eo(t),t):(eo(t),null)}return eo(t),t.flags&128?(t.lanes=n,t):(n=r!==null,e=e!==null&&e.memoizedState!==null,n&&(r=t.child,a=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(a=r.alternate.memoizedState.cachePool.pool),o=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(o=r.memoizedState.cachePool.pool),o!==a&&(r.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),Ac(t,t.updateQueue),Mc(t),null);case 4:return ae(),e===null&&Td(t.stateNode.containerInfo),Mc(t),null;case 10:return Bi(t.type),Mc(t),null;case 19:if(z(to),r=t.memoizedState,r===null)return Mc(t),null;if(a=(t.flags&128)!=0,o=r.rendering,o===null)if(a)jc(r,!1);else{if(Gl!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(o=no(e),o!==null){for(t.flags|=128,jc(r,!1),e=o.updateQueue,t.updateQueue=e,Ac(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)ni(n,e),n=n.sibling;return B(to,to.current&1|2),J&&yi(t,r.treeForkCount),t.child}e=e.sibling}r.tail!==null&&ye()>nu&&(t.flags|=128,a=!0,jc(r,!1),t.lanes=4194304)}else{if(!a)if(e=no(o),e!==null){if(t.flags|=128,a=!0,e=e.updateQueue,t.updateQueue=e,Ac(t,e),jc(r,!0),r.tail===null&&r.tailMode===`hidden`&&!o.alternate&&!J)return Mc(t),null}else 2*ye()-r.renderingStartTime>nu&&n!==536870912&&(t.flags|=128,a=!0,jc(r,!1),t.lanes=4194304);r.isBackwards?(o.sibling=t.child,t.child=o):(e=r.last,e===null?t.child=o:e.sibling=o,r.last=o)}return r.tail===null?(Mc(t),null):(e=r.tail,r.rendering=e,r.tail=e.sibling,r.renderingStartTime=ye(),e.sibling=null,n=to.current,B(to,a?n&1|2:n&1),J&&yi(t,r.treeForkCount),e);case 22:case 23:return eo(t),qa(),r=t.memoizedState!==null,e===null?r&&(t.flags|=8192):e.memoizedState!==null!==r&&(t.flags|=8192),r?n&536870912&&!(t.flags&128)&&(Mc(t),t.subtreeFlags&6&&(t.flags|=8192)):Mc(t),n=t.updateQueue,n!==null&&Ac(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),r=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(r=t.memoizedState.cachePool.pool),r!==n&&(t.flags|=2048),e!==null&&z(la),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),Bi(Qi),Mc(t),null;case 25:return null;case 30:return null}throw Error(i(156,t.tag))}function Pc(e,t){switch(Si(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Bi(Qi),ae(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return W(t),null;case 31:if(t.memoizedState!==null){if(eo(t),t.alternate===null)throw Error(i(340));Ni()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(eo(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(i(340));Ni()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return z(to),null;case 4:return ae(),null;case 10:return Bi(t.type),null;case 22:case 23:return eo(t),qa(),e!==null&&z(la),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return Bi(Qi),null;case 25:return null;default:return null}}function Fc(e,t){switch(Si(t),t.tag){case 3:Bi(Qi),ae();break;case 26:case 27:case 5:W(t);break;case 4:ae();break;case 31:t.memoizedState!==null&&eo(t);break;case 13:eo(t);break;case 19:z(to);break;case 10:Bi(t.type);break;case 22:case 23:eo(t),qa(),e!==null&&z(la);break;case 24:Bi(Qi)}}function Ic(e,t){try{var n=t.updateQueue,r=n===null?null:n.lastEffect;if(r!==null){var i=r.next;n=i;do{if((n.tag&e)===e){r=void 0;var a=n.create,o=n.inst;r=a(),o.destroy=r}n=n.next}while(n!==i)}}catch(e){Ku(t,t.return,e)}}function Lc(e,t,n){try{var r=t.updateQueue,i=r===null?null:r.lastEffect;if(i!==null){var a=i.next;r=a;do{if((r.tag&e)===e){var o=r.inst,s=o.destroy;if(s!==void 0){o.destroy=void 0,i=t;var c=n,l=s;try{l()}catch(e){Ku(i,c,e)}}}r=r.next}while(r!==a)}}catch(e){Ku(t,t.return,e)}}function Rc(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{Ha(t,n)}catch(t){Ku(e,e.return,t)}}}function zc(e,t,n){n.props=Bs(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(n){Ku(e,t,n)}}function Bc(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var r=e.stateNode;break;case 30:r=e.stateNode;break;default:r=e.stateNode}typeof n==`function`?e.refCleanup=n(r):n.current=r}}catch(n){Ku(e,t,n)}}function Vc(e,t){var n=e.ref,r=e.refCleanup;if(n!==null)if(typeof r==`function`)try{r()}catch(n){Ku(e,t,n)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n==`function`)try{n(null)}catch(n){Ku(e,t,n)}else n.current=null}function Hc(e){var t=e.type,n=e.memoizedProps,r=e.stateNode;try{a:switch(t){case`button`:case`input`:case`select`:case`textarea`:n.autoFocus&&r.focus();break a;case`img`:n.src?r.src=n.src:n.srcSet&&(r.srcset=n.srcSet)}}catch(t){Ku(e,e.return,t)}}function Uc(e,t,n){try{var r=e.stateNode;zd(r,e.type,n,t),r[et]=t}catch(t){Ku(e,e.return,t)}}function Wc(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&tf(e.type)||e.tag===4}function Gc(e){a:for(;;){for(;e.sibling===null;){if(e.return===null||Wc(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&tf(e.type)||e.flags&2||e.child===null||e.tag===4)continue a;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Kc(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n).insertBefore(e,t):(t=n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n,t.appendChild(e),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=Gt));else if(r!==4&&(r===27&&tf(e.type)&&(n=e.stateNode,t=null),e=e.child,e!==null))for(Kc(e,t,n),e=e.sibling;e!==null;)Kc(e,t,n),e=e.sibling}function qc(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(r!==4&&(r===27&&tf(e.type)&&(n=e.stateNode),e=e.child,e!==null))for(qc(e,t,n),e=e.sibling;e!==null;)qc(e,t,n),e=e.sibling}function Jc(e){var t=e.stateNode,n=e.memoizedProps;try{for(var r=e.type,i=t.attributes;i.length;)t.removeAttributeNode(i[0]);Rd(t,r,n),t[$e]=e,t[et]=n}catch(t){Ku(e,e.return,t)}}var Yc=!1,Xc=!1,Zc=!1,Qc=typeof WeakSet==`function`?WeakSet:Set,$c=null;function el(e,t){if(e=e.containerInfo,Hd=dp,e=vr(e),yr(e)){if(`selectionStart`in e)var n={start:e.selectionStart,end:e.selectionEnd};else a:{n=(n=e.ownerDocument)&&n.defaultView||window;var r=n.getSelection&&n.getSelection();if(r&&r.rangeCount!==0){n=r.anchorNode;var a=r.anchorOffset,o=r.focusNode;r=r.focusOffset;try{n.nodeType,o.nodeType}catch{n=null;break a}var s=0,c=-1,l=-1,u=0,d=0,f=e,p=null;b:for(;;){for(var m;f!==n||a!==0&&f.nodeType!==3||(c=s+a),f!==o||r!==0&&f.nodeType!==3||(l=s+r),f.nodeType===3&&(s+=f.nodeValue.length),(m=f.firstChild)!==null;)p=f,f=m;for(;;){if(f===e)break b;if(p===n&&++u===a&&(c=s),p===o&&++d===r&&(l=s),(m=f.nextSibling)!==null)break;f=p,p=f.parentNode}f=m}n=c===-1||l===-1?null:{start:c,end:l}}else n=null}n||={start:0,end:0}}else n=null;for(Ud={focusedElem:e,selectionRange:n},dp=!1,$c=t;$c!==null;)if(t=$c,e=t.child,t.subtreeFlags&1028&&e!==null)e.return=t,$c=e;else for(;$c!==null;){switch(t=$c,o=t.alternate,e=t.flags,t.tag){case 0:if(e&4&&(e=t.updateQueue,e=e===null?null:e.events,e!==null))for(n=0;n<e.length;n++)a=e[n],a.ref.impl=a.nextImpl;break;case 11:case 15:break;case 1:if(e&1024&&o!==null){e=void 0,n=t,a=o.memoizedProps,o=o.memoizedState,r=n.stateNode;try{var h=Bs(n.type,a);e=r.getSnapshotBeforeUpdate(h,o),r.__reactInternalSnapshotBeforeUpdate=e}catch(e){Ku(n,n.return,e)}}break;case 3:if(e&1024){if(e=t.stateNode.containerInfo,n=e.nodeType,n===9)af(e);else if(n===1)switch(e.nodeName){case`HEAD`:case`HTML`:case`BODY`:af(e);break;default:e.textContent=``}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if(e&1024)throw Error(i(163))}if(e=t.sibling,e!==null){e.return=t.return,$c=e;break}$c=t.return}}function tl(e,t,n){var r=n.flags;switch(n.tag){case 0:case 11:case 15:gl(e,n),r&4&&Ic(5,n);break;case 1:if(gl(e,n),r&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(e){Ku(n,n.return,e)}else{var i=Bs(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(i,t,e.__reactInternalSnapshotBeforeUpdate)}catch(e){Ku(n,n.return,e)}}r&64&&Rc(n),r&512&&Bc(n,n.return);break;case 3:if(gl(e,n),r&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{Ha(e,t)}catch(e){Ku(n,n.return,e)}}break;case 27:t===null&&r&4&&Jc(n);case 26:case 5:gl(e,n),t===null&&r&4&&Hc(n),r&512&&Bc(n,n.return);break;case 12:gl(e,n);break;case 31:gl(e,n),r&4&&sl(e,n);break;case 13:gl(e,n),r&4&&cl(e,n),r&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=Xu.bind(null,n),df(e,n))));break;case 22:if(r=n.memoizedState!==null||Yc,!r){t=t!==null&&t.memoizedState!==null||Xc,i=Yc;var a=Xc;Yc=r,(Xc=t)&&!a?vl(e,n,(n.subtreeFlags&8772)!=0):gl(e,n),Yc=i,Xc=a}break;case 30:break;default:gl(e,n)}}function nl(e){var t=e.alternate;t!==null&&(e.alternate=null,nl(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&st(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var rl=null,il=!1;function al(e,t,n){for(n=n.child;n!==null;)ol(e,t,n),n=n.sibling}function ol(e,t,n){if(Oe&&typeof Oe.onCommitFiberUnmount==`function`)try{Oe.onCommitFiberUnmount(De,n)}catch{}switch(n.tag){case 26:Xc||Vc(n,t),al(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:Xc||Vc(n,t);var r=rl,i=il;tf(n.type)&&(rl=n.stateNode,il=!1),al(e,t,n),_f(n.stateNode),rl=r,il=i;break;case 5:Xc||Vc(n,t);case 6:if(r=rl,i=il,rl=null,al(e,t,n),rl=r,il=i,rl!==null)if(il)try{(rl.nodeType===9?rl.body:rl.nodeName===`HTML`?rl.ownerDocument.body:rl).removeChild(n.stateNode)}catch(e){Ku(n,t,e)}else try{rl.removeChild(n.stateNode)}catch(e){Ku(n,t,e)}break;case 18:rl!==null&&(il?(e=rl,nf(e.nodeType===9?e.body:e.nodeName===`HTML`?e.ownerDocument.body:e,n.stateNode),Lp(e)):nf(rl,n.stateNode));break;case 4:r=rl,i=il,rl=n.stateNode.containerInfo,il=!0,al(e,t,n),rl=r,il=i;break;case 0:case 11:case 14:case 15:Lc(2,n,t),Xc||Lc(4,n,t),al(e,t,n);break;case 1:Xc||(Vc(n,t),r=n.stateNode,typeof r.componentWillUnmount==`function`&&zc(n,t,r)),al(e,t,n);break;case 21:al(e,t,n);break;case 22:Xc=(r=Xc)||n.memoizedState!==null,al(e,t,n),Xc=r;break;default:al(e,t,n)}}function sl(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Lp(e)}catch(e){Ku(t,t.return,e)}}}function cl(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Lp(e)}catch(e){Ku(t,t.return,e)}}function ll(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Qc),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Qc),t;default:throw Error(i(435,e.tag))}}function ul(e,t){var n=ll(e);t.forEach(function(t){if(!n.has(t)){n.add(t);var r=Zu.bind(null,e,t);t.then(r,r)}})}function dl(e,t){var n=t.deletions;if(n!==null)for(var r=0;r<n.length;r++){var a=n[r],o=e,s=t,c=s;a:for(;c!==null;){switch(c.tag){case 27:if(tf(c.type)){rl=c.stateNode,il=!1;break a}break;case 5:rl=c.stateNode,il=!1;break a;case 3:case 4:rl=c.stateNode.containerInfo,il=!0;break a}c=c.return}if(rl===null)throw Error(i(160));ol(o,s,a),rl=null,il=!1,o=a.alternate,o!==null&&(o.return=null),a.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)pl(t,e),t=t.sibling}var fl=null;function pl(e,t){var n=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:dl(t,e),ml(e),r&4&&(Lc(3,e,e.return),Ic(3,e),Lc(5,e,e.return));break;case 1:dl(t,e),ml(e),r&512&&(Xc||n===null||Vc(n,n.return)),r&64&&Yc&&(e=e.updateQueue,e!==null&&(r=e.callbacks,r!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?r:n.concat(r))));break;case 26:var a=fl;if(dl(t,e),ml(e),r&512&&(Xc||n===null||Vc(n,n.return)),r&4){var o=n===null?null:n.memoizedState;if(r=e.memoizedState,n===null)if(r===null)if(e.stateNode===null){a:{r=e.type,n=e.memoizedProps,a=a.ownerDocument||a;b:switch(r){case`title`:o=a.getElementsByTagName(`title`)[0],(!o||o[ot]||o[$e]||o.namespaceURI===`http://www.w3.org/2000/svg`||o.hasAttribute(`itemprop`))&&(o=a.createElement(r),a.head.insertBefore(o,a.querySelector(`head > title`))),Rd(o,r,n),o[$e]=e,ft(o),r=o;break a;case`link`:var s=Gf(`link`,`href`,a).get(r+(n.href||``));if(s){for(var c=0;c<s.length;c++)if(o=s[c],o.getAttribute(`href`)===(n.href==null||n.href===``?null:n.href)&&o.getAttribute(`rel`)===(n.rel==null?null:n.rel)&&o.getAttribute(`title`)===(n.title==null?null:n.title)&&o.getAttribute(`crossorigin`)===(n.crossOrigin==null?null:n.crossOrigin)){s.splice(c,1);break b}}o=a.createElement(r),Rd(o,r,n),a.head.appendChild(o);break;case`meta`:if(s=Gf(`meta`,`content`,a).get(r+(n.content||``))){for(c=0;c<s.length;c++)if(o=s[c],o.getAttribute(`content`)===(n.content==null?null:``+n.content)&&o.getAttribute(`name`)===(n.name==null?null:n.name)&&o.getAttribute(`property`)===(n.property==null?null:n.property)&&o.getAttribute(`http-equiv`)===(n.httpEquiv==null?null:n.httpEquiv)&&o.getAttribute(`charset`)===(n.charSet==null?null:n.charSet)){s.splice(c,1);break b}}o=a.createElement(r),Rd(o,r,n),a.head.appendChild(o);break;default:throw Error(i(468,r))}o[$e]=e,ft(o),r=o}e.stateNode=r}else Kf(a,e.type,e.stateNode);else e.stateNode=Bf(a,r,e.memoizedProps);else o===r?r===null&&e.stateNode!==null&&Uc(e,e.memoizedProps,n.memoizedProps):(o===null?n.stateNode!==null&&(n=n.stateNode,n.parentNode.removeChild(n)):o.count--,r===null?Kf(a,e.type,e.stateNode):Bf(a,r,e.memoizedProps))}break;case 27:dl(t,e),ml(e),r&512&&(Xc||n===null||Vc(n,n.return)),n!==null&&r&4&&Uc(e,e.memoizedProps,n.memoizedProps);break;case 5:if(dl(t,e),ml(e),r&512&&(Xc||n===null||Vc(n,n.return)),e.flags&32){a=e.stateNode;try{Lt(a,``)}catch(t){Ku(e,e.return,t)}}r&4&&e.stateNode!=null&&(a=e.memoizedProps,Uc(e,a,n===null?a:n.memoizedProps)),r&1024&&(Zc=!0);break;case 6:if(dl(t,e),ml(e),r&4){if(e.stateNode===null)throw Error(i(162));r=e.memoizedProps,n=e.stateNode;try{n.nodeValue=r}catch(t){Ku(e,e.return,t)}}break;case 3:if(Wf=null,a=fl,fl=bf(t.containerInfo),dl(t,e),fl=a,ml(e),r&4&&n!==null&&n.memoizedState.isDehydrated)try{Lp(t.containerInfo)}catch(t){Ku(e,e.return,t)}Zc&&(Zc=!1,hl(e));break;case 4:r=fl,fl=bf(e.stateNode.containerInfo),dl(t,e),ml(e),fl=r;break;case 12:dl(t,e),ml(e);break;case 31:dl(t,e),ml(e),r&4&&(r=e.updateQueue,r!==null&&(e.updateQueue=null,ul(e,r)));break;case 13:dl(t,e),ml(e),e.child.flags&8192&&e.memoizedState!==null!=(n!==null&&n.memoizedState!==null)&&(eu=ye()),r&4&&(r=e.updateQueue,r!==null&&(e.updateQueue=null,ul(e,r)));break;case 22:a=e.memoizedState!==null;var l=n!==null&&n.memoizedState!==null,u=Yc,d=Xc;if(Yc=u||a,Xc=d||l,dl(t,e),Xc=d,Yc=u,ml(e),r&8192)a:for(t=e.stateNode,t._visibility=a?t._visibility&-2:t._visibility|1,a&&(n===null||l||Yc||Xc||_l(e)),n=null,t=e;;){if(t.tag===5||t.tag===26){if(n===null){l=n=t;try{if(o=l.stateNode,a)s=o.style,typeof s.setProperty==`function`?s.setProperty(`display`,`none`,`important`):s.display=`none`;else{c=l.stateNode;var f=l.memoizedProps.style,p=f!=null&&f.hasOwnProperty(`display`)?f.display:null;c.style.display=p==null||typeof p==`boolean`?``:(``+p).trim()}}catch(e){Ku(l,l.return,e)}}}else if(t.tag===6){if(n===null){l=t;try{l.stateNode.nodeValue=a?``:l.memoizedProps}catch(e){Ku(l,l.return,e)}}}else if(t.tag===18){if(n===null){l=t;try{var m=l.stateNode;a?rf(m,!0):rf(l.stateNode,!1)}catch(e){Ku(l,l.return,e)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break a;for(;t.sibling===null;){if(t.return===null||t.return===e)break a;n===t&&(n=null),t=t.return}n===t&&(n=null),t.sibling.return=t.return,t=t.sibling}r&4&&(r=e.updateQueue,r!==null&&(n=r.retryQueue,n!==null&&(r.retryQueue=null,ul(e,n))));break;case 19:dl(t,e),ml(e),r&4&&(r=e.updateQueue,r!==null&&(e.updateQueue=null,ul(e,r)));break;case 30:break;case 21:break;default:dl(t,e),ml(e)}}function ml(e){var t=e.flags;if(t&2){try{for(var n,r=e.return;r!==null;){if(Wc(r)){n=r;break}r=r.return}if(n==null)throw Error(i(160));switch(n.tag){case 27:var a=n.stateNode;qc(e,Gc(e),a);break;case 5:var o=n.stateNode;n.flags&32&&(Lt(o,``),n.flags&=-33),qc(e,Gc(e),o);break;case 3:case 4:var s=n.stateNode.containerInfo;Kc(e,Gc(e),s);break;default:throw Error(i(161))}}catch(t){Ku(e,e.return,t)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function hl(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;hl(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function gl(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)tl(e,t.alternate,t),t=t.sibling}function _l(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:Lc(4,t,t.return),_l(t);break;case 1:Vc(t,t.return);var n=t.stateNode;typeof n.componentWillUnmount==`function`&&zc(t,t.return,n),_l(t);break;case 27:_f(t.stateNode);case 26:case 5:Vc(t,t.return),_l(t);break;case 22:t.memoizedState===null&&_l(t);break;case 30:_l(t);break;default:_l(t)}e=e.sibling}}function vl(e,t,n){for(n&&=(t.subtreeFlags&8772)!=0,t=t.child;t!==null;){var r=t.alternate,i=e,a=t,o=a.flags;switch(a.tag){case 0:case 11:case 15:vl(i,a,n),Ic(4,a);break;case 1:if(vl(i,a,n),r=a,i=r.stateNode,typeof i.componentDidMount==`function`)try{i.componentDidMount()}catch(e){Ku(r,r.return,e)}if(r=a,i=r.updateQueue,i!==null){var s=r.stateNode;try{var c=i.shared.hiddenCallbacks;if(c!==null)for(i.shared.hiddenCallbacks=null,i=0;i<c.length;i++)Va(c[i],s)}catch(e){Ku(r,r.return,e)}}n&&o&64&&Rc(a),Bc(a,a.return);break;case 27:Jc(a);case 26:case 5:vl(i,a,n),n&&r===null&&o&4&&Hc(a),Bc(a,a.return);break;case 12:vl(i,a,n);break;case 31:vl(i,a,n),n&&o&4&&sl(i,a);break;case 13:vl(i,a,n),n&&o&4&&cl(i,a);break;case 22:a.memoizedState===null&&vl(i,a,n),Bc(a,a.return);break;case 30:break;default:vl(i,a,n)}t=t.sibling}}function yl(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&ea(n))}function bl(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&ea(e))}function xl(e,t,n,r){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)Sl(e,t,n,r),t=t.sibling}function Sl(e,t,n,r){var i=t.flags;switch(t.tag){case 0:case 11:case 15:xl(e,t,n,r),i&2048&&Ic(9,t);break;case 1:xl(e,t,n,r);break;case 3:xl(e,t,n,r),i&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&ea(e)));break;case 12:if(i&2048){xl(e,t,n,r),e=t.stateNode;try{var a=t.memoizedProps,o=a.id,s=a.onPostCommit;typeof s==`function`&&s(o,t.alternate===null?`mount`:`update`,e.passiveEffectDuration,-0)}catch(e){Ku(t,t.return,e)}}else xl(e,t,n,r);break;case 31:xl(e,t,n,r);break;case 13:xl(e,t,n,r);break;case 23:break;case 22:a=t.stateNode,o=t.alternate,t.memoizedState===null?a._visibility&2?xl(e,t,n,r):(a._visibility|=2,Cl(e,t,n,r,(t.subtreeFlags&10256)!=0||!1)):a._visibility&2?xl(e,t,n,r):wl(e,t),i&2048&&yl(o,t);break;case 24:xl(e,t,n,r),i&2048&&bl(t.alternate,t);break;default:xl(e,t,n,r)}}function Cl(e,t,n,r,i){for(i&&=(t.subtreeFlags&10256)!=0||!1,t=t.child;t!==null;){var a=e,o=t,s=n,c=r,l=o.flags;switch(o.tag){case 0:case 11:case 15:Cl(a,o,s,c,i),Ic(8,o);break;case 23:break;case 22:var u=o.stateNode;o.memoizedState===null?(u._visibility|=2,Cl(a,o,s,c,i)):u._visibility&2?Cl(a,o,s,c,i):wl(a,o),i&&l&2048&&yl(o.alternate,o);break;case 24:Cl(a,o,s,c,i),i&&l&2048&&bl(o.alternate,o);break;default:Cl(a,o,s,c,i)}t=t.sibling}}function wl(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,r=t,i=r.flags;switch(r.tag){case 22:wl(n,r),i&2048&&yl(r.alternate,r);break;case 24:wl(n,r),i&2048&&bl(r.alternate,r);break;default:wl(n,r)}t=t.sibling}}var Tl=8192;function El(e,t,n){if(e.subtreeFlags&Tl)for(e=e.child;e!==null;)Dl(e,t,n),e=e.sibling}function Dl(e,t,n){switch(e.tag){case 26:El(e,t,n),e.flags&Tl&&e.memoizedState!==null&&Yf(n,fl,e.memoizedState,e.memoizedProps);break;case 5:El(e,t,n);break;case 3:case 4:var r=fl;fl=bf(e.stateNode.containerInfo),El(e,t,n),fl=r;break;case 22:e.memoizedState===null&&(r=e.alternate,r!==null&&r.memoizedState!==null?(r=Tl,Tl=16777216,El(e,t,n),Tl=r):El(e,t,n));break;default:El(e,t,n)}}function Ol(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function kl(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];$c=r,Ml(r,e)}Ol(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Al(e),e=e.sibling}function Al(e){switch(e.tag){case 0:case 11:case 15:kl(e),e.flags&2048&&Lc(9,e,e.return);break;case 3:kl(e);break;case 12:kl(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,jl(e)):kl(e);break;default:kl(e)}}function jl(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];$c=r,Ml(r,e)}Ol(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Lc(8,t,t.return),jl(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,jl(t));break;default:jl(t)}e=e.sibling}}function Ml(e,t){for(;$c!==null;){var n=$c;switch(n.tag){case 0:case 11:case 15:Lc(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var r=n.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:ea(n.memoizedState.cache)}if(r=n.child,r!==null)r.return=n,$c=r;else a:for(n=e;$c!==null;){r=$c;var i=r.sibling,a=r.return;if(nl(r),r===n){$c=null;break a}if(i!==null){i.return=a,$c=i;break a}$c=a}}}var Nl={getCacheForType:function(e){var t=Ki(Qi),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return Ki(Qi).controller.signal}},Pl=typeof WeakMap==`function`?WeakMap:Map,Fl=0,Il=null,Ll=null,Rl=0,zl=0,Bl=null,Vl=!1,Hl=!1,Ul=!1,Wl=0,Gl=0,Kl=0,ql=0,Jl=0,Yl=0,Xl=0,Zl=null,Ql=null,$l=!1,eu=0,tu=0,nu=1/0,ru=null,iu=null,au=0,ou=null,su=null,cu=0,lu=0,uu=null,du=null,fu=0,pu=null;function mu(){return Fl&2&&Rl!==0?Rl&-Rl:F.T===null?Xe():pd()}function hu(){if(Yl===0)if(!(Rl&536870912)||J){var e=Fe;Fe<<=1,!(Fe&3932160)&&(Fe=262144),Yl=e}else Yl=536870912;return e=Ja.current,e!==null&&(e.flags|=32),Yl}function gu(e,t,n){(e===Il&&(zl===2||zl===9)||e.cancelPendingCommit!==null)&&(Cu(e,0),bu(e,Rl,Yl,!1)),Ue(e,n),(!(Fl&2)||e!==Il)&&(e===Il&&(!(Fl&2)&&(ql|=n),Gl===4&&bu(e,Rl,Yl,!1)),ad(e))}function _u(e,t,n){if(Fl&6)throw Error(i(327));var r=!n&&(t&127)==0&&(t&e.expiredLanes)===0||ze(e,t),a=r?ju(e,t):ku(e,t,!0),o=r;do{if(a===0){Hl&&!r&&bu(e,t,0,!1);break}else{if(n=e.current.alternate,o&&!yu(n)){a=ku(e,t,!1),o=!1;continue}if(a===2){if(o=t,e.errorRecoveryDisabledLanes&o)var s=0;else s=e.pendingLanes&-536870913,s=s===0?s&536870912?536870912:0:s;if(s!==0){t=s;a:{var c=e;a=Zl;var l=c.current.memoizedState.isDehydrated;if(l&&(Cu(c,s).flags|=256),s=ku(c,s,!1),s!==2){if(Ul&&!l){c.errorRecoveryDisabledLanes|=o,ql|=o,a=4;break a}o=Ql,Ql=a,o!==null&&(Ql===null?Ql=o:Ql.push.apply(Ql,o))}a=s}if(o=!1,a!==2)continue}}if(a===1){Cu(e,0),bu(e,t,0,!0);break}a:{switch(r=e,o=a,o){case 0:case 1:throw Error(i(345));case 4:if((t&4194048)!==t)break;case 6:bu(r,t,Yl,!Vl);break a;case 2:Ql=null;break;case 3:case 5:break;default:throw Error(i(329))}if((t&62914560)===t&&(a=eu+300-ye(),10<a)){if(bu(r,t,Yl,!Vl),Re(r,0,!0)!==0)break a;cu=t,r.timeoutHandle=Xd(vu.bind(null,r,n,Ql,ru,$l,t,Yl,ql,Xl,Vl,o,`Throttled`,-0,0),a);break a}vu(r,n,Ql,ru,$l,t,Yl,ql,Xl,Vl,o,null,-0,0)}}break}while(1);ad(e)}function vu(e,t,n,r,i,a,o,s,c,l,u,d,f,p){if(e.timeoutHandle=-1,d=t.subtreeFlags,d&8192||(d&16785408)==16785408){d={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:Gt},Dl(t,a,d);var m=(a&62914560)===a?eu-ye():(a&4194048)===a?tu-ye():0;if(m=Zf(d,m),m!==null){cu=a,e.cancelPendingCommit=m(Ru.bind(null,e,t,a,n,r,i,o,s,c,u,d,null,f,p)),bu(e,a,o,!l);return}}Ru(e,t,a,n,r,i,o,s,c)}function yu(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var r=0;r<n.length;r++){var i=n[r],a=i.getSnapshot;i=i.value;try{if(!pr(a(),i))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function bu(e,t,n,r){t&=~Jl,t&=~ql,e.suspendedLanes|=t,e.pingedLanes&=~t,r&&(e.warmLanes|=t),r=e.expirationTimes;for(var i=t;0<i;){var a=31-Ae(i),o=1<<a;r[a]=-1,i&=~o}n!==0&&Ge(e,n,t)}function xu(){return Fl&6?!0:(od(0,!1),!1)}function Su(){if(Ll!==null){if(zl===0)var e=Ll.return;else e=Ll,Ri=Li=null,So(e),Ca=null,wa=0,e=Ll;for(;e!==null;)Fc(e.alternate,e),e=e.return;Ll=null}}function Cu(e,t){var n=e.timeoutHandle;n!==-1&&(e.timeoutHandle=-1,Zd(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),cu=0,Su(),Il=e,Ll=n=ti(e.current,null),Rl=t,zl=0,Bl=null,Vl=!1,Hl=ze(e,t),Ul=!1,Xl=Yl=Jl=ql=Kl=Gl=0,Ql=Zl=null,$l=!1,t&8&&(t|=t&32);var r=e.entangledLanes;if(r!==0)for(e=e.entanglements,r&=t;0<r;){var i=31-Ae(r),a=1<<i;t|=e[i],r&=~a}return Wl=t,Gr(),n}function wu(e,t){Y=null,F.H=Ms,t===pa||t===ha?(t=xa(),zl=3):t===ma?(t=xa(),zl=4):zl=t===Xs?8:typeof t==`object`&&t&&typeof t.then==`function`?6:1,Bl=t,Ll===null&&(Gl=1,Ws(e,li(t,e.current)))}function Tu(){var e=Ja.current;return e===null?!0:(Rl&4194048)===Rl?Ya===null:(Rl&62914560)===Rl||Rl&536870912?e===Ya:!1}function Eu(){var e=F.H;return F.H=Ms,e===null?Ms:e}function Du(){var e=F.A;return F.A=Nl,e}function Ou(){Gl=4,Vl||(Rl&4194048)!==Rl&&Ja.current!==null||(Hl=!0),!(Kl&134217727)&&!(ql&134217727)||Il===null||bu(Il,Rl,Yl,!1)}function ku(e,t,n){var r=Fl;Fl|=2;var i=Eu(),a=Du();(Il!==e||Rl!==t)&&(ru=null,Cu(e,t)),t=!1;var o=Gl;a:do try{if(zl!==0&&Ll!==null){var s=Ll,c=Bl;switch(zl){case 8:Su(),o=6;break a;case 3:case 2:case 9:case 6:Ja.current===null&&(t=!0);var l=zl;if(zl=0,Bl=null,Fu(e,s,c,l),n&&Hl){o=0;break a}break;default:l=zl,zl=0,Bl=null,Fu(e,s,c,l)}}Au(),o=Gl;break}catch(t){wu(e,t)}while(1);return t&&e.shellSuspendCounter++,Ri=Li=null,Fl=r,F.H=i,F.A=a,Ll===null&&(Il=null,Rl=0,Gr()),o}function Au(){for(;Ll!==null;)Nu(Ll)}function ju(e,t){var n=Fl;Fl|=2;var r=Eu(),a=Du();Il!==e||Rl!==t?(ru=null,nu=ye()+500,Cu(e,t)):Hl=ze(e,t);a:do try{if(zl!==0&&Ll!==null){t=Ll;var o=Bl;b:switch(zl){case 1:zl=0,Bl=null,Fu(e,t,o,1);break;case 2:case 9:if(_a(o)){zl=0,Bl=null,Pu(t);break}t=function(){zl!==2&&zl!==9||Il!==e||(zl=7),ad(e)},o.then(t,t);break a;case 3:zl=7;break a;case 4:zl=5;break a;case 7:_a(o)?(zl=0,Bl=null,Pu(t)):(zl=0,Bl=null,Fu(e,t,o,7));break;case 5:var s=null;switch(Ll.tag){case 26:s=Ll.memoizedState;case 5:case 27:var c=Ll;if(s?Jf(s):c.stateNode.complete){zl=0,Bl=null;var l=c.sibling;if(l!==null)Ll=l;else{var u=c.return;u===null?Ll=null:(Ll=u,Iu(u))}break b}}zl=0,Bl=null,Fu(e,t,o,5);break;case 6:zl=0,Bl=null,Fu(e,t,o,6);break;case 8:Su(),Gl=6;break a;default:throw Error(i(462))}}Mu();break}catch(t){wu(e,t)}while(1);return Ri=Li=null,F.H=r,F.A=a,Fl=n,Ll===null?(Il=null,Rl=0,Gr(),Gl):0}function Mu(){for(;Ll!==null&&!_e();)Nu(Ll)}function Nu(e){var t=Ec(e.alternate,e,Wl);e.memoizedProps=e.pendingProps,t===null?Iu(e):Ll=t}function Pu(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=uc(n,t,t.pendingProps,t.type,void 0,Rl);break;case 11:t=uc(n,t,t.pendingProps,t.type.render,t.ref,Rl);break;case 5:So(t);default:Fc(n,t),t=Ll=ni(t,Wl),t=Ec(n,t,Wl)}e.memoizedProps=e.pendingProps,t===null?Iu(e):Ll=t}function Fu(e,t,n,r){Ri=Li=null,So(t),Ca=null,wa=0;var i=t.return;try{if(Ys(e,i,t,n,Rl)){Gl=1,Ws(e,li(n,e.current)),Ll=null;return}}catch(t){if(i!==null)throw Ll=i,t;Gl=1,Ws(e,li(n,e.current)),Ll=null;return}t.flags&32768?(J||r===1?e=!0:Hl||Rl&536870912?e=!1:(Vl=e=!0,(r===2||r===9||r===3||r===6)&&(r=Ja.current,r!==null&&r.tag===13&&(r.flags|=16384))),Lu(t,e)):Iu(t)}function Iu(e){var t=e;do{if(t.flags&32768){Lu(t,Vl);return}e=t.return;var n=Nc(t.alternate,t,Wl);if(n!==null){Ll=n;return}if(t=t.sibling,t!==null){Ll=t;return}Ll=t=e}while(t!==null);Gl===0&&(Gl=5)}function Lu(e,t){do{var n=Pc(e.alternate,e);if(n!==null){n.flags&=32767,Ll=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){Ll=e;return}Ll=e=n}while(e!==null);Gl=6,Ll=null}function Ru(e,t,n,r,a,o,s,c,l){e.cancelPendingCommit=null;do Uu();while(au!==0);if(Fl&6)throw Error(i(327));if(t!==null){if(t===e.current)throw Error(i(177));if(o=t.lanes|t.childLanes,o|=Wr,We(e,n,o,s,c,l),e===Il&&(Ll=Il=null,Rl=0),su=t,ou=e,cu=n,lu=o,uu=a,du=r,t.subtreeFlags&10256||t.flags&10256?(e.callbackNode=null,e.callbackPriority=0,Qu(Ce,function(){return Wu(),null})):(e.callbackNode=null,e.callbackPriority=0),r=(t.flags&13878)!=0,t.subtreeFlags&13878||r){r=F.T,F.T=null,a=I.p,I.p=2,s=Fl,Fl|=4;try{el(e,t,n)}finally{Fl=s,I.p=a,F.T=r}}au=1,zu(),Bu(),Vu()}}function zu(){if(au===1){au=0;var e=ou,t=su,n=(t.flags&13878)!=0;if(t.subtreeFlags&13878||n){n=F.T,F.T=null;var r=I.p;I.p=2;var i=Fl;Fl|=4;try{pl(t,e);var a=Ud,o=vr(e.containerInfo),s=a.focusedElem,c=a.selectionRange;if(o!==s&&s&&s.ownerDocument&&_r(s.ownerDocument.documentElement,s)){if(c!==null&&yr(s)){var l=c.start,u=c.end;if(u===void 0&&(u=l),`selectionStart`in s)s.selectionStart=l,s.selectionEnd=Math.min(u,s.value.length);else{var d=s.ownerDocument||document,f=d&&d.defaultView||window;if(f.getSelection){var p=f.getSelection(),m=s.textContent.length,h=Math.min(c.start,m),g=c.end===void 0?h:Math.min(c.end,m);!p.extend&&h>g&&(o=g,g=h,h=o);var _=gr(s,h),v=gr(s,g);if(_&&v&&(p.rangeCount!==1||p.anchorNode!==_.node||p.anchorOffset!==_.offset||p.focusNode!==v.node||p.focusOffset!==v.offset)){var y=d.createRange();y.setStart(_.node,_.offset),p.removeAllRanges(),h>g?(p.addRange(y),p.extend(v.node,v.offset)):(y.setEnd(v.node,v.offset),p.addRange(y))}}}}for(d=[],p=s;p=p.parentNode;)p.nodeType===1&&d.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof s.focus==`function`&&s.focus(),s=0;s<d.length;s++){var b=d[s];b.element.scrollLeft=b.left,b.element.scrollTop=b.top}}dp=!!Hd,Ud=Hd=null}finally{Fl=i,I.p=r,F.T=n}}e.current=t,au=2}}function Bu(){if(au===2){au=0;var e=ou,t=su,n=(t.flags&8772)!=0;if(t.subtreeFlags&8772||n){n=F.T,F.T=null;var r=I.p;I.p=2;var i=Fl;Fl|=4;try{tl(e,t.alternate,t)}finally{Fl=i,I.p=r,F.T=n}}au=3}}function Vu(){if(au===4||au===3){au=0,ve();var e=ou,t=su,n=cu,r=du;t.subtreeFlags&10256||t.flags&10256?au=5:(au=0,su=ou=null,Hu(e,e.pendingLanes));var i=e.pendingLanes;if(i===0&&(iu=null),Ye(n),t=t.stateNode,Oe&&typeof Oe.onCommitFiberRoot==`function`)try{Oe.onCommitFiberRoot(De,t,void 0,(t.current.flags&128)==128)}catch{}if(r!==null){t=F.T,i=I.p,I.p=2,F.T=null;try{for(var a=e.onRecoverableError,o=0;o<r.length;o++){var s=r[o];a(s.value,{componentStack:s.stack})}}finally{F.T=t,I.p=i}}cu&3&&Uu(),ad(e),i=e.pendingLanes,n&261930&&i&42?e===pu?fu++:(fu=0,pu=e):fu=0,od(0,!1)}}function Hu(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,ea(t)))}function Uu(){return zu(),Bu(),Vu(),Wu()}function Wu(){if(au!==5)return!1;var e=ou,t=lu;lu=0;var n=Ye(cu),r=F.T,a=I.p;try{I.p=32>n?32:n,F.T=null,n=uu,uu=null;var o=ou,s=cu;if(au=0,su=ou=null,cu=0,Fl&6)throw Error(i(331));var c=Fl;if(Fl|=4,Al(o.current),Sl(o,o.current,s,n),Fl=c,od(0,!1),Oe&&typeof Oe.onPostCommitFiberRoot==`function`)try{Oe.onPostCommitFiberRoot(De,o)}catch{}return!0}finally{I.p=a,F.T=r,Hu(e,t)}}function Gu(e,t,n){t=li(n,t),t=Ks(e.stateNode,t,2),e=Fa(e,t,2),e!==null&&(Ue(e,2),ad(e))}function Ku(e,t,n){if(e.tag===3)Gu(e,e,n);else for(;t!==null;){if(t.tag===3){Gu(t,e,n);break}else if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError==`function`||typeof r.componentDidCatch==`function`&&(iu===null||!iu.has(r))){e=li(n,e),n=qs(2),r=Fa(t,n,2),r!==null&&(Js(n,r,t,e),Ue(r,2),ad(r));break}}t=t.return}}function qu(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new Pl;var i=new Set;r.set(t,i)}else i=r.get(t),i===void 0&&(i=new Set,r.set(t,i));i.has(n)||(Ul=!0,i.add(n),e=Ju.bind(null,e,t,n),t.then(e,e))}function Ju(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,Il===e&&(Rl&n)===n&&(Gl===4||Gl===3&&(Rl&62914560)===Rl&&300>ye()-eu?!(Fl&2)&&Cu(e,0):Jl|=n,Xl===Rl&&(Xl=0)),ad(e)}function Yu(e,t){t===0&&(t=Ve()),e=Jr(e,t),e!==null&&(Ue(e,t),ad(e))}function Xu(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),Yu(e,n)}function Zu(e,t){var n=0;switch(e.tag){case 31:case 13:var r=e.stateNode,a=e.memoizedState;a!==null&&(n=a.retryLane);break;case 19:r=e.stateNode;break;case 22:r=e.stateNode._retryCache;break;default:throw Error(i(314))}r!==null&&r.delete(t),Yu(e,n)}function Qu(e,t){return he(e,t)}var $u=null,ed=null,td=!1,nd=!1,rd=!1,id=0;function ad(e){e!==ed&&e.next===null&&(ed===null?$u=ed=e:ed=ed.next=e),nd=!0,td||(td=!0,fd())}function od(e,t){if(!rd&&nd){rd=!0;do for(var n=!1,r=$u;r!==null;){if(!t)if(e!==0){var i=r.pendingLanes;if(i===0)var a=0;else{var o=r.suspendedLanes,s=r.pingedLanes;a=(1<<31-Ae(42|e)+1)-1,a&=i&~(o&~s),a=a&201326741?a&201326741|1:a?a|2:0}a!==0&&(n=!0,dd(r,a))}else a=Rl,a=Re(r,r===Il?a:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),!(a&3)||ze(r,a)||(n=!0,dd(r,a));r=r.next}while(n);rd=!1}}function sd(){cd()}function cd(){nd=td=!1;var e=0;id!==0&&Yd()&&(e=id);for(var t=ye(),n=null,r=$u;r!==null;){var i=r.next,a=ld(r,t);a===0?(r.next=null,n===null?$u=i:n.next=i,i===null&&(ed=n)):(n=r,(e!==0||a&3)&&(nd=!0)),r=i}au!==0&&au!==5||od(e,!1),id!==0&&(id=0)}function ld(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,i=e.expirationTimes,a=e.pendingLanes&-62914561;0<a;){var o=31-Ae(a),s=1<<o,c=i[o];c===-1?((s&n)===0||(s&r)!==0)&&(i[o]=Be(s,t)):c<=t&&(e.expiredLanes|=s),a&=~s}if(t=Il,n=Rl,n=Re(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r=e.callbackNode,n===0||e===t&&(zl===2||zl===9)||e.cancelPendingCommit!==null)return r!==null&&r!==null&&ge(r),e.callbackNode=null,e.callbackPriority=0;if(!(n&3)||ze(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(r!==null&&ge(r),Ye(n)){case 2:case 8:n=Se;break;case 32:n=Ce;break;case 268435456:n=Te;break;default:n=Ce}return r=ud.bind(null,e),n=he(n,r),e.callbackPriority=t,e.callbackNode=n,t}return r!==null&&r!==null&&ge(r),e.callbackPriority=2,e.callbackNode=null,2}function ud(e,t){if(au!==0&&au!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(Uu()&&e.callbackNode!==n)return null;var r=Rl;return r=Re(e,e===Il?r:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r===0?null:(_u(e,r,t),ld(e,ye()),e.callbackNode!=null&&e.callbackNode===n?ud.bind(null,e):null)}function dd(e,t){if(Uu())return null;_u(e,t,!0)}function fd(){$d(function(){Fl&6?he(xe,sd):cd()})}function pd(){if(id===0){var e=ra;e===0&&(e=Pe,Pe<<=1,!(Pe&261888)&&(Pe=256)),id=e}return id}function md(e){return e==null||typeof e==`symbol`||typeof e==`boolean`?null:typeof e==`function`?e:Wt(``+e)}function hd(e,t){var n=t.ownerDocument.createElement(`input`);return n.name=t.name,n.value=t.value,e.id&&n.setAttribute(`form`,e.id),t.parentNode.insertBefore(n,t),e=new FormData(e),n.parentNode.removeChild(n),e}function gd(e,t,n,r,i){if(t===`submit`&&n&&n.stateNode===i){var a=md((i[et]||null).action),o=r.submitter;o&&(t=(t=o[et]||null)?md(t.formAction):o.getAttribute(`formAction`),t!==null&&(a=t,o=null));var s=new pn(`action`,`action`,null,r,i);e.push({event:s,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(id!==0){var e=o?hd(i,o):new FormData(i);vs(n,{pending:!0,data:e,method:i.method,action:a},null,e)}}else typeof a==`function`&&(s.preventDefault(),e=o?hd(i,o):new FormData(i),vs(n,{pending:!0,data:e,method:i.method,action:a},a,e))},currentTarget:i}]})}}for(var _d=0;_d<zr.length;_d++){var vd=zr[_d];Br(vd.toLowerCase(),`on`+(vd[0].toUpperCase()+vd.slice(1)))}Br(jr,`onAnimationEnd`),Br(Mr,`onAnimationIteration`),Br(Nr,`onAnimationStart`),Br(`dblclick`,`onDoubleClick`),Br(`focusin`,`onFocus`),Br(`focusout`,`onBlur`),Br(Pr,`onTransitionRun`),Br(Fr,`onTransitionStart`),Br(Ir,`onTransitionCancel`),Br(Lr,`onTransitionEnd`),gt(`onMouseEnter`,[`mouseout`,`mouseover`]),gt(`onMouseLeave`,[`mouseout`,`mouseover`]),gt(`onPointerEnter`,[`pointerout`,`pointerover`]),gt(`onPointerLeave`,[`pointerout`,`pointerover`]),ht(`onChange`,`change click focusin focusout input keydown keyup selectionchange`.split(` `)),ht(`onSelect`,`focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(` `)),ht(`onBeforeInput`,[`compositionend`,`keypress`,`textInput`,`paste`]),ht(`onCompositionEnd`,`compositionend focusout keydown keypress keyup mousedown`.split(` `)),ht(`onCompositionStart`,`compositionstart focusout keydown keypress keyup mousedown`.split(` `)),ht(`onCompositionUpdate`,`compositionupdate focusout keydown keypress keyup mousedown`.split(` `));var yd=`abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(` `),bd=new Set(`beforetoggle cancel close invalid load scroll scrollend toggle`.split(` `).concat(yd));function xd(e,t){t=(t&4)!=0;for(var n=0;n<e.length;n++){var r=e[n],i=r.event;r=r.listeners;a:{var a=void 0;if(t)for(var o=r.length-1;0<=o;o--){var s=r[o],c=s.instance,l=s.currentTarget;if(s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){Vr(e)}i.currentTarget=null,a=c}else for(o=0;o<r.length;o++){if(s=r[o],c=s.instance,l=s.currentTarget,s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){Vr(e)}i.currentTarget=null,a=c}}}}function Sd(e,t){var n=t[nt];n===void 0&&(n=t[nt]=new Set);var r=e+`__bubble`;n.has(r)||(Ed(t,e,2,!1),n.add(r))}function Cd(e,t,n){var r=0;t&&(r|=4),Ed(n,e,r,t)}var wd=`_reactListening`+Math.random().toString(36).slice(2);function Td(e){if(!e[wd]){e[wd]=!0,pt.forEach(function(t){t!==`selectionchange`&&(bd.has(t)||Cd(t,!1,e),Cd(t,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[wd]||(t[wd]=!0,Cd(`selectionchange`,!1,t))}}function Ed(e,t,n,r){switch(vp(t)){case 2:var i=fp;break;case 8:i=pp;break;default:i=mp}n=i.bind(null,t,n,e),i=void 0,!tn||t!==`touchstart`&&t!==`touchmove`&&t!==`wheel`||(i=!0),r?i===void 0?e.addEventListener(t,n,!0):e.addEventListener(t,n,{capture:!0,passive:i}):i===void 0?e.addEventListener(t,n,!1):e.addEventListener(t,n,{passive:i})}function Dd(e,t,n,r,i){var a=r;if(!(t&1)&&!(t&2)&&r!==null)a:for(;;){if(r===null)return;var s=r.tag;if(s===3||s===4){var c=r.stateNode.containerInfo;if(c===i)break;if(s===4)for(s=r.return;s!==null;){var l=s.tag;if((l===3||l===4)&&s.stateNode.containerInfo===i)return;s=s.return}for(;c!==null;){if(s=ct(c),s===null)return;if(l=s.tag,l===5||l===6||l===26||l===27){r=a=s;continue a}c=c.parentNode}}r=r.return}Qt(function(){var r=a,i=qt(n),s=[];a:{var c=Rr.get(e);if(c!==void 0){var l=pn,u=e;switch(e){case`keypress`:if(cn(n)===0)break a;case`keydown`:case`keyup`:l=An;break;case`focusin`:u=`focus`,l=Sn;break;case`focusout`:u=`blur`,l=Sn;break;case`beforeblur`:case`afterblur`:l=Sn;break;case`click`:if(n.button===2)break a;case`auxclick`:case`dblclick`:case`mousedown`:case`mousemove`:case`mouseup`:case`mouseout`:case`mouseover`:case`contextmenu`:l=bn;break;case`drag`:case`dragend`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`dragstart`:case`drop`:l=xn;break;case`touchcancel`:case`touchend`:case`touchmove`:case`touchstart`:l=Mn;break;case jr:case Mr:case Nr:l=Cn;break;case Lr:l=Nn;break;case`scroll`:case`scrollend`:l=hn;break;case`wheel`:l=Pn;break;case`copy`:case`cut`:case`paste`:l=wn;break;case`gotpointercapture`:case`lostpointercapture`:case`pointercancel`:case`pointerdown`:case`pointermove`:case`pointerout`:case`pointerover`:case`pointerup`:l=jn;break;case`toggle`:case`beforetoggle`:l=Fn}var d=(t&4)!=0,f=!d&&(e===`scroll`||e===`scrollend`),p=d?c===null?null:c+`Capture`:c;d=[];for(var m=r,h;m!==null;){var g=m;if(h=g.stateNode,g=g.tag,g!==5&&g!==26&&g!==27||h===null||p===null||(g=$t(m,p),g!=null&&d.push(Od(m,g,h))),f)break;m=m.return}0<d.length&&(c=new l(c,u,null,n,i),s.push({event:c,listeners:d}))}}if(!(t&7)){a:{if(c=e===`mouseover`||e===`pointerover`,l=e===`mouseout`||e===`pointerout`,c&&n!==Kt&&(u=n.relatedTarget||n.fromElement)&&(ct(u)||u[tt]))break a;if((l||c)&&(c=i.window===i?i:(c=i.ownerDocument)?c.defaultView||c.parentWindow:window,l?(u=n.relatedTarget||n.toElement,l=r,u=u?ct(u):null,u!==null&&(f=o(u),d=u.tag,u!==f||d!==5&&d!==27&&d!==6)&&(u=null)):(l=null,u=r),l!==u)){if(d=bn,g=`onMouseLeave`,p=`onMouseEnter`,m=`mouse`,(e===`pointerout`||e===`pointerover`)&&(d=jn,g=`onPointerLeave`,p=`onPointerEnter`,m=`pointer`),f=l==null?c:ut(l),h=u==null?c:ut(u),c=new d(g,m+`leave`,l,n,i),c.target=f,c.relatedTarget=h,g=null,ct(i)===r&&(d=new d(p,m+`enter`,u,n,i),d.target=h,d.relatedTarget=f,g=d),f=g,l&&u)b:{for(d=Ad,p=l,m=u,h=0,g=p;g;g=d(g))h++;g=0;for(var _=m;_;_=d(_))g++;for(;0<h-g;)p=d(p),h--;for(;0<g-h;)m=d(m),g--;for(;h--;){if(p===m||m!==null&&p===m.alternate){d=p;break b}p=d(p),m=d(m)}d=null}else d=null;l!==null&&jd(s,c,l,d,!1),u!==null&&f!==null&&jd(s,f,u,d,!0)}}a:{if(c=r?ut(r):window,l=c.nodeName&&c.nodeName.toLowerCase(),l===`select`||l===`input`&&c.type===`file`)var v=tr;else if(Yn(c))if(nr)v=dr;else{v=lr;var y=cr}else l=c.nodeName,!l||l.toLowerCase()!==`input`||c.type!==`checkbox`&&c.type!==`radio`?r&&Vt(r.elementType)&&(v=tr):v=ur;if(v&&=v(e,r)){Xn(s,v,n,i);break a}y&&y(e,c,r),e===`focusout`&&r&&c.type===`number`&&r.memoizedProps.value!=null&&Nt(c,`number`,c.value)}switch(y=r?ut(r):window,e){case`focusin`:(Yn(y)||y.contentEditable===`true`)&&(xr=y,Sr=r,Cr=null);break;case`focusout`:Cr=Sr=xr=null;break;case`mousedown`:wr=!0;break;case`contextmenu`:case`mouseup`:case`dragend`:wr=!1,Tr(s,n,i);break;case`selectionchange`:if(br)break;case`keydown`:case`keyup`:Tr(s,n,i)}var b;if(Ln)b:{switch(e){case`compositionstart`:var x=`onCompositionStart`;break b;case`compositionend`:x=`onCompositionEnd`;break b;case`compositionupdate`:x=`onCompositionUpdate`;break b}x=void 0}else Gn?Un(e,n)&&(x=`onCompositionEnd`):e===`keydown`&&n.keyCode===229&&(x=`onCompositionStart`);x&&(Bn&&n.locale!==`ko`&&(Gn||x!==`onCompositionStart`?x===`onCompositionEnd`&&Gn&&(b=sn()):(rn=i,an=`value`in rn?rn.value:rn.textContent,Gn=!0)),y=kd(r,x),0<y.length&&(x=new Tn(x,e,null,n,i),s.push({event:x,listeners:y}),b?x.data=b:(b=Wn(n),b!==null&&(x.data=b)))),(b=zn?Kn(e,n):qn(e,n))&&(x=kd(r,`onBeforeInput`),0<x.length&&(y=new Tn(`onBeforeInput`,`beforeinput`,null,n,i),s.push({event:y,listeners:x}),y.data=b)),gd(s,e,r,n,i)}xd(s,t)})}function Od(e,t,n){return{instance:e,listener:t,currentTarget:n}}function kd(e,t){for(var n=t+`Capture`,r=[];e!==null;){var i=e,a=i.stateNode;if(i=i.tag,i!==5&&i!==26&&i!==27||a===null||(i=$t(e,n),i!=null&&r.unshift(Od(e,i,a)),i=$t(e,t),i!=null&&r.push(Od(e,i,a))),e.tag===3)return r;e=e.return}return[]}function Ad(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function jd(e,t,n,r,i){for(var a=t._reactName,o=[];n!==null&&n!==r;){var s=n,c=s.alternate,l=s.stateNode;if(s=s.tag,c!==null&&c===r)break;s!==5&&s!==26&&s!==27||l===null||(c=l,i?(l=$t(n,a),l!=null&&o.unshift(Od(n,l,c))):i||(l=$t(n,a),l!=null&&o.push(Od(n,l,c)))),n=n.return}o.length!==0&&e.push({event:t,listeners:o})}var Md=/\r\n?/g,Nd=/\u0000|\uFFFD/g;function Pd(e){return(typeof e==`string`?e:``+e).replace(Md,`
`).replace(Nd,``)}function Fd(e,t){return t=Pd(t),Pd(e)===t}function Id(e,t,n,r,a,o){switch(n){case`children`:typeof r==`string`?t===`body`||t===`textarea`&&r===``||Lt(e,r):(typeof r==`number`||typeof r==`bigint`)&&t!==`body`&&Lt(e,``+r);break;case`className`:St(e,`class`,r);break;case`tabIndex`:St(e,`tabindex`,r);break;case`dir`:case`role`:case`viewBox`:case`width`:case`height`:St(e,n,r);break;case`style`:Bt(e,r,o);break;case`data`:if(t!==`object`){St(e,`data`,r);break}case`src`:case`href`:if(r===``&&(t!==`a`||n!==`href`)){e.removeAttribute(n);break}if(r==null||typeof r==`function`||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=Wt(``+r),e.setAttribute(n,r);break;case`action`:case`formAction`:if(typeof r==`function`){e.setAttribute(n,`javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`);break}else typeof o==`function`&&(n===`formAction`?(t!==`input`&&Id(e,t,`name`,a.name,a,null),Id(e,t,`formEncType`,a.formEncType,a,null),Id(e,t,`formMethod`,a.formMethod,a,null),Id(e,t,`formTarget`,a.formTarget,a,null)):(Id(e,t,`encType`,a.encType,a,null),Id(e,t,`method`,a.method,a,null),Id(e,t,`target`,a.target,a,null)));if(r==null||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=Wt(``+r),e.setAttribute(n,r);break;case`onClick`:r!=null&&(e.onclick=Gt);break;case`onScroll`:r!=null&&Sd(`scroll`,e);break;case`onScrollEnd`:r!=null&&Sd(`scrollend`,e);break;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));e.innerHTML=n}}break;case`multiple`:e.multiple=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`muted`:e.muted=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`defaultValue`:case`defaultChecked`:case`innerHTML`:case`ref`:break;case`autoFocus`:break;case`xlinkHref`:if(r==null||typeof r==`function`||typeof r==`boolean`||typeof r==`symbol`){e.removeAttribute(`xlink:href`);break}n=Wt(``+r),e.setAttributeNS(`http://www.w3.org/1999/xlink`,`xlink:href`,n);break;case`contentEditable`:case`spellCheck`:case`draggable`:case`value`:case`autoReverse`:case`externalResourcesRequired`:case`focusable`:case`preserveAlpha`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,``+r):e.removeAttribute(n);break;case`inert`:case`allowFullScreen`:case`async`:case`autoPlay`:case`controls`:case`default`:case`defer`:case`disabled`:case`disablePictureInPicture`:case`disableRemotePlayback`:case`formNoValidate`:case`hidden`:case`loop`:case`noModule`:case`noValidate`:case`open`:case`playsInline`:case`readOnly`:case`required`:case`reversed`:case`scoped`:case`seamless`:case`itemScope`:r&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,``):e.removeAttribute(n);break;case`capture`:case`download`:!0===r?e.setAttribute(n,``):!1!==r&&r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,r):e.removeAttribute(n);break;case`cols`:case`rows`:case`size`:case`span`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`&&!isNaN(r)&&1<=r?e.setAttribute(n,r):e.removeAttribute(n);break;case`rowSpan`:case`start`:r==null||typeof r==`function`||typeof r==`symbol`||isNaN(r)?e.removeAttribute(n):e.setAttribute(n,r);break;case`popover`:Sd(`beforetoggle`,e),Sd(`toggle`,e),xt(e,`popover`,r);break;case`xlinkActuate`:Ct(e,`http://www.w3.org/1999/xlink`,`xlink:actuate`,r);break;case`xlinkArcrole`:Ct(e,`http://www.w3.org/1999/xlink`,`xlink:arcrole`,r);break;case`xlinkRole`:Ct(e,`http://www.w3.org/1999/xlink`,`xlink:role`,r);break;case`xlinkShow`:Ct(e,`http://www.w3.org/1999/xlink`,`xlink:show`,r);break;case`xlinkTitle`:Ct(e,`http://www.w3.org/1999/xlink`,`xlink:title`,r);break;case`xlinkType`:Ct(e,`http://www.w3.org/1999/xlink`,`xlink:type`,r);break;case`xmlBase`:Ct(e,`http://www.w3.org/XML/1998/namespace`,`xml:base`,r);break;case`xmlLang`:Ct(e,`http://www.w3.org/XML/1998/namespace`,`xml:lang`,r);break;case`xmlSpace`:Ct(e,`http://www.w3.org/XML/1998/namespace`,`xml:space`,r);break;case`is`:xt(e,`is`,r);break;case`innerText`:case`textContent`:break;default:(!(2<n.length)||n[0]!==`o`&&n[0]!==`O`||n[1]!==`n`&&n[1]!==`N`)&&(n=Ht.get(n)||n,xt(e,n,r))}}function Ld(e,t,n,r,a,o){switch(n){case`style`:Bt(e,r,o);break;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));e.innerHTML=n}}break;case`children`:typeof r==`string`?Lt(e,r):(typeof r==`number`||typeof r==`bigint`)&&Lt(e,``+r);break;case`onScroll`:r!=null&&Sd(`scroll`,e);break;case`onScrollEnd`:r!=null&&Sd(`scrollend`,e);break;case`onClick`:r!=null&&(e.onclick=Gt);break;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`innerHTML`:case`ref`:break;case`innerText`:case`textContent`:break;default:if(!mt.hasOwnProperty(n))a:{if(n[0]===`o`&&n[1]===`n`&&(a=n.endsWith(`Capture`),t=n.slice(2,a?n.length-7:void 0),o=e[et]||null,o=o==null?null:o[n],typeof o==`function`&&e.removeEventListener(t,o,a),typeof r==`function`)){typeof o!=`function`&&o!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(t,r,a);break a}n in e?e[n]=r:!0===r?e.setAttribute(n,``):xt(e,n,r)}}}function Rd(e,t,n){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`img`:Sd(`error`,e),Sd(`load`,e);var r=!1,a=!1,o;for(o in n)if(n.hasOwnProperty(o)){var s=n[o];if(s!=null)switch(o){case`src`:r=!0;break;case`srcSet`:a=!0;break;case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:Id(e,t,o,s,n,null)}}a&&Id(e,t,`srcSet`,n.srcSet,n,null),r&&Id(e,t,`src`,n.src,n,null);return;case`input`:Sd(`invalid`,e);var c=o=s=a=null,l=null,u=null;for(r in n)if(n.hasOwnProperty(r)){var d=n[r];if(d!=null)switch(r){case`name`:a=d;break;case`type`:s=d;break;case`checked`:l=d;break;case`defaultChecked`:u=d;break;case`value`:o=d;break;case`defaultValue`:c=d;break;case`children`:case`dangerouslySetInnerHTML`:if(d!=null)throw Error(i(137,t));break;default:Id(e,t,r,d,n,null)}}Mt(e,o,c,l,u,s,a,!1);return;case`select`:for(a in Sd(`invalid`,e),r=s=o=null,n)if(n.hasOwnProperty(a)&&(c=n[a],c!=null))switch(a){case`value`:o=c;break;case`defaultValue`:s=c;break;case`multiple`:r=c;default:Id(e,t,a,c,n,null)}t=o,n=s,e.multiple=!!r,t==null?n!=null&&Pt(e,!!r,n,!0):Pt(e,!!r,t,!1);return;case`textarea`:for(s in Sd(`invalid`,e),o=a=r=null,n)if(n.hasOwnProperty(s)&&(c=n[s],c!=null))switch(s){case`value`:r=c;break;case`defaultValue`:a=c;break;case`children`:o=c;break;case`dangerouslySetInnerHTML`:if(c!=null)throw Error(i(91));break;default:Id(e,t,s,c,n,null)}It(e,r,a,o);return;case`option`:for(l in n)if(n.hasOwnProperty(l)&&(r=n[l],r!=null))switch(l){case`selected`:e.selected=r&&typeof r!=`function`&&typeof r!=`symbol`;break;default:Id(e,t,l,r,n,null)}return;case`dialog`:Sd(`beforetoggle`,e),Sd(`toggle`,e),Sd(`cancel`,e),Sd(`close`,e);break;case`iframe`:case`object`:Sd(`load`,e);break;case`video`:case`audio`:for(r=0;r<yd.length;r++)Sd(yd[r],e);break;case`image`:Sd(`error`,e),Sd(`load`,e);break;case`details`:Sd(`toggle`,e);break;case`embed`:case`source`:case`link`:Sd(`error`,e),Sd(`load`,e);case`area`:case`base`:case`br`:case`col`:case`hr`:case`keygen`:case`meta`:case`param`:case`track`:case`wbr`:case`menuitem`:for(u in n)if(n.hasOwnProperty(u)&&(r=n[u],r!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:Id(e,t,u,r,n,null)}return;default:if(Vt(t)){for(d in n)n.hasOwnProperty(d)&&(r=n[d],r!==void 0&&Ld(e,t,d,r,n,void 0));return}}for(c in n)n.hasOwnProperty(c)&&(r=n[c],r!=null&&Id(e,t,c,r,n,null))}function zd(e,t,n,r){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`input`:var a=null,o=null,s=null,c=null,l=null,u=null,d=null;for(m in n){var f=n[m];if(n.hasOwnProperty(m)&&f!=null)switch(m){case`checked`:break;case`value`:break;case`defaultValue`:l=f;default:r.hasOwnProperty(m)||Id(e,t,m,null,r,f)}}for(var p in r){var m=r[p];if(f=n[p],r.hasOwnProperty(p)&&(m!=null||f!=null))switch(p){case`type`:o=m;break;case`name`:a=m;break;case`checked`:u=m;break;case`defaultChecked`:d=m;break;case`value`:s=m;break;case`defaultValue`:c=m;break;case`children`:case`dangerouslySetInnerHTML`:if(m!=null)throw Error(i(137,t));break;default:m!==f&&Id(e,t,p,m,r,f)}}jt(e,s,c,l,u,d,o,a);return;case`select`:for(o in m=s=c=p=null,n)if(l=n[o],n.hasOwnProperty(o)&&l!=null)switch(o){case`value`:break;case`multiple`:m=l;default:r.hasOwnProperty(o)||Id(e,t,o,null,r,l)}for(a in r)if(o=r[a],l=n[a],r.hasOwnProperty(a)&&(o!=null||l!=null))switch(a){case`value`:p=o;break;case`defaultValue`:c=o;break;case`multiple`:s=o;default:o!==l&&Id(e,t,a,o,r,l)}t=c,n=s,r=m,p==null?!!r!=!!n&&(t==null?Pt(e,!!n,n?[]:``,!1):Pt(e,!!n,t,!0)):Pt(e,!!n,p,!1);return;case`textarea`:for(c in m=p=null,n)if(a=n[c],n.hasOwnProperty(c)&&a!=null&&!r.hasOwnProperty(c))switch(c){case`value`:break;case`children`:break;default:Id(e,t,c,null,r,a)}for(s in r)if(a=r[s],o=n[s],r.hasOwnProperty(s)&&(a!=null||o!=null))switch(s){case`value`:p=a;break;case`defaultValue`:m=a;break;case`children`:break;case`dangerouslySetInnerHTML`:if(a!=null)throw Error(i(91));break;default:a!==o&&Id(e,t,s,a,r,o)}Ft(e,p,m);return;case`option`:for(var h in n)if(p=n[h],n.hasOwnProperty(h)&&p!=null&&!r.hasOwnProperty(h))switch(h){case`selected`:e.selected=!1;break;default:Id(e,t,h,null,r,p)}for(l in r)if(p=r[l],m=n[l],r.hasOwnProperty(l)&&p!==m&&(p!=null||m!=null))switch(l){case`selected`:e.selected=p&&typeof p!=`function`&&typeof p!=`symbol`;break;default:Id(e,t,l,p,r,m)}return;case`img`:case`link`:case`area`:case`base`:case`br`:case`col`:case`embed`:case`hr`:case`keygen`:case`meta`:case`param`:case`source`:case`track`:case`wbr`:case`menuitem`:for(var g in n)p=n[g],n.hasOwnProperty(g)&&p!=null&&!r.hasOwnProperty(g)&&Id(e,t,g,null,r,p);for(u in r)if(p=r[u],m=n[u],r.hasOwnProperty(u)&&p!==m&&(p!=null||m!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:if(p!=null)throw Error(i(137,t));break;default:Id(e,t,u,p,r,m)}return;default:if(Vt(t)){for(var _ in n)p=n[_],n.hasOwnProperty(_)&&p!==void 0&&!r.hasOwnProperty(_)&&Ld(e,t,_,void 0,r,p);for(d in r)p=r[d],m=n[d],!r.hasOwnProperty(d)||p===m||p===void 0&&m===void 0||Ld(e,t,d,p,r,m);return}}for(var v in n)p=n[v],n.hasOwnProperty(v)&&p!=null&&!r.hasOwnProperty(v)&&Id(e,t,v,null,r,p);for(f in r)p=r[f],m=n[f],!r.hasOwnProperty(f)||p===m||p==null&&m==null||Id(e,t,f,p,r,m)}function Bd(e){switch(e){case`css`:case`script`:case`font`:case`img`:case`image`:case`input`:case`link`:return!0;default:return!1}}function Vd(){if(typeof performance.getEntriesByType==`function`){for(var e=0,t=0,n=performance.getEntriesByType(`resource`),r=0;r<n.length;r++){var i=n[r],a=i.transferSize,o=i.initiatorType,s=i.duration;if(a&&s&&Bd(o)){for(o=0,s=i.responseEnd,r+=1;r<n.length;r++){var c=n[r],l=c.startTime;if(l>s)break;var u=c.transferSize,d=c.initiatorType;u&&Bd(d)&&(c=c.responseEnd,o+=u*(c<s?1:(s-l)/(c-l)))}if(--r,t+=8*(a+o)/(i.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e==`number`)?e:5}var Hd=null,Ud=null;function Wd(e){return e.nodeType===9?e:e.ownerDocument}function Gd(e){switch(e){case`http://www.w3.org/2000/svg`:return 1;case`http://www.w3.org/1998/Math/MathML`:return 2;default:return 0}}function Kd(e,t){if(e===0)switch(t){case`svg`:return 1;case`math`:return 2;default:return 0}return e===1&&t===`foreignObject`?0:e}function qd(e,t){return e===`textarea`||e===`noscript`||typeof t.children==`string`||typeof t.children==`number`||typeof t.children==`bigint`||typeof t.dangerouslySetInnerHTML==`object`&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Jd=null;function Yd(){var e=window.event;return e&&e.type===`popstate`?e===Jd?!1:(Jd=e,!0):(Jd=null,!1)}var Xd=typeof setTimeout==`function`?setTimeout:void 0,Zd=typeof clearTimeout==`function`?clearTimeout:void 0,Qd=typeof Promise==`function`?Promise:void 0,$d=typeof queueMicrotask==`function`?queueMicrotask:Qd===void 0?Xd:function(e){return Qd.resolve(null).then(e).catch(ef)};function ef(e){setTimeout(function(){throw e})}function tf(e){return e===`head`}function nf(e,t){var n=t,r=0;do{var i=n.nextSibling;if(e.removeChild(n),i&&i.nodeType===8)if(n=i.data,n===`/$`||n===`/&`){if(r===0){e.removeChild(i),Lp(t);return}r--}else if(n===`$`||n===`$?`||n===`$~`||n===`$!`||n===`&`)r++;else if(n===`html`)_f(e.ownerDocument.documentElement);else if(n===`head`){n=e.ownerDocument.head,_f(n);for(var a=n.firstChild;a;){var o=a.nextSibling,s=a.nodeName;a[ot]||s===`SCRIPT`||s===`STYLE`||s===`LINK`&&a.rel.toLowerCase()===`stylesheet`||n.removeChild(a),a=o}}else n===`body`&&_f(e.ownerDocument.body);n=i}while(n);Lp(t)}function rf(e,t){var n=e;e=0;do{var r=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display=`none`):(n.style.display=n._stashedDisplay||``,n.getAttribute(`style`)===``&&n.removeAttribute(`style`)):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=``):n.nodeValue=n._stashedText||``),r&&r.nodeType===8)if(n=r.data,n===`/$`){if(e===0)break;e--}else n!==`$`&&n!==`$?`&&n!==`$~`&&n!==`$!`||e++;n=r}while(n)}function af(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case`HTML`:case`HEAD`:case`BODY`:af(n),st(n);continue;case`SCRIPT`:case`STYLE`:continue;case`LINK`:if(n.rel.toLowerCase()===`stylesheet`)continue}e.removeChild(n)}}function of(e,t,n,r){for(;e.nodeType===1;){var i=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!r&&(e.nodeName!==`INPUT`||e.type!==`hidden`))break}else if(!r)if(t===`input`&&e.type===`hidden`){var a=i.name==null?null:``+i.name;if(i.type===`hidden`&&e.getAttribute(`name`)===a)return e}else return e;else if(!e[ot])switch(t){case`meta`:if(!e.hasAttribute(`itemprop`))break;return e;case`link`:if(a=e.getAttribute(`rel`),a===`stylesheet`&&e.hasAttribute(`data-precedence`)||a!==i.rel||e.getAttribute(`href`)!==(i.href==null||i.href===``?null:i.href)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin)||e.getAttribute(`title`)!==(i.title==null?null:i.title))break;return e;case`style`:if(e.hasAttribute(`data-precedence`))break;return e;case`script`:if(a=e.getAttribute(`src`),(a!==(i.src==null?null:i.src)||e.getAttribute(`type`)!==(i.type==null?null:i.type)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin))&&a&&e.hasAttribute(`async`)&&!e.hasAttribute(`itemprop`))break;return e;default:return e}if(e=ff(e.nextSibling),e===null)break}return null}function sf(e,t,n){if(t===``)return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!n||(e=ff(e.nextSibling),e===null))return null;return e}function cf(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!t||(e=ff(e.nextSibling),e===null))return null;return e}function lf(e){return e.data===`$?`||e.data===`$~`}function uf(e){return e.data===`$!`||e.data===`$?`&&e.ownerDocument.readyState!==`loading`}function df(e,t){var n=e.ownerDocument;if(e.data===`$~`)e._reactRetry=t;else if(e.data!==`$?`||n.readyState!==`loading`)t();else{var r=function(){t(),n.removeEventListener(`DOMContentLoaded`,r)};n.addEventListener(`DOMContentLoaded`,r),e._reactRetry=r}}function ff(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t===`$`||t===`$!`||t===`$?`||t===`$~`||t===`&`||t===`F!`||t===`F`)break;if(t===`/$`||t===`/&`)return null}}return e}var pf=null;function mf(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`/$`||n===`/&`){if(t===0)return ff(e.nextSibling);t--}else n!==`$`&&n!==`$!`&&n!==`$?`&&n!==`$~`&&n!==`&`||t++}e=e.nextSibling}return null}function hf(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`$`||n===`$!`||n===`$?`||n===`$~`||n===`&`){if(t===0)return e;t--}else n!==`/$`&&n!==`/&`||t++}e=e.previousSibling}return null}function gf(e,t,n){switch(t=Wd(n),e){case`html`:if(e=t.documentElement,!e)throw Error(i(452));return e;case`head`:if(e=t.head,!e)throw Error(i(453));return e;case`body`:if(e=t.body,!e)throw Error(i(454));return e;default:throw Error(i(451))}}function _f(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);st(e)}var vf=new Map,yf=new Set;function bf(e){return typeof e.getRootNode==`function`?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var xf=I.d;I.d={f:Sf,r:Cf,D:Ef,C:Df,L:Of,m:kf,X:jf,S:Af,M:Mf};function Sf(){var e=xf.f(),t=xu();return e||t}function Cf(e){var t=lt(e);t!==null&&t.tag===5&&t.type===`form`?bs(t):xf.r(e)}var wf=typeof document>`u`?null:document;function Tf(e,t,n){var r=wf;if(r&&typeof t==`string`&&t){var i=At(t);i=`link[rel="`+e+`"][href="`+i+`"]`,typeof n==`string`&&(i+=`[crossorigin="`+n+`"]`),yf.has(i)||(yf.add(i),e={rel:e,crossOrigin:n,href:t},r.querySelector(i)===null&&(t=r.createElement(`link`),Rd(t,`link`,e),ft(t),r.head.appendChild(t)))}}function Ef(e){xf.D(e),Tf(`dns-prefetch`,e,null)}function Df(e,t){xf.C(e,t),Tf(`preconnect`,e,t)}function Of(e,t,n){xf.L(e,t,n);var r=wf;if(r&&e&&t){var i=`link[rel="preload"][as="`+At(t)+`"]`;t===`image`&&n&&n.imageSrcSet?(i+=`[imagesrcset="`+At(n.imageSrcSet)+`"]`,typeof n.imageSizes==`string`&&(i+=`[imagesizes="`+At(n.imageSizes)+`"]`)):i+=`[href="`+At(e)+`"]`;var a=i;switch(t){case`style`:a=Pf(e);break;case`script`:a=Rf(e)}vf.has(a)||(e=h({rel:`preload`,href:t===`image`&&n&&n.imageSrcSet?void 0:e,as:t},n),vf.set(a,e),r.querySelector(i)!==null||t===`style`&&r.querySelector(Ff(a))||t===`script`&&r.querySelector(zf(a))||(t=r.createElement(`link`),Rd(t,`link`,e),ft(t),r.head.appendChild(t)))}}function kf(e,t){xf.m(e,t);var n=wf;if(n&&e){var r=t&&typeof t.as==`string`?t.as:`script`,i=`link[rel="modulepreload"][as="`+At(r)+`"][href="`+At(e)+`"]`,a=i;switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:a=Rf(e)}if(!vf.has(a)&&(e=h({rel:`modulepreload`,href:e},t),vf.set(a,e),n.querySelector(i)===null)){switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:if(n.querySelector(zf(a)))return}r=n.createElement(`link`),Rd(r,`link`,e),ft(r),n.head.appendChild(r)}}}function Af(e,t,n){xf.S(e,t,n);var r=wf;if(r&&e){var i=dt(r).hoistableStyles,a=Pf(e);t||=`default`;var o=i.get(a);if(!o){var s={loading:0,preload:null};if(o=r.querySelector(Ff(a)))s.loading=5;else{e=h({rel:`stylesheet`,href:e,"data-precedence":t},n),(n=vf.get(a))&&Hf(e,n);var c=o=r.createElement(`link`);ft(c),Rd(c,`link`,e),c._p=new Promise(function(e,t){c.onload=e,c.onerror=t}),c.addEventListener(`load`,function(){s.loading|=1}),c.addEventListener(`error`,function(){s.loading|=2}),s.loading|=4,Vf(o,t,r)}o={type:`stylesheet`,instance:o,count:1,state:s},i.set(a,o)}}}function jf(e,t){xf.X(e,t);var n=wf;if(n&&e){var r=dt(n).hoistableScripts,i=Rf(e),a=r.get(i);a||(a=n.querySelector(zf(i)),a||(e=h({src:e,async:!0},t),(t=vf.get(i))&&Uf(e,t),a=n.createElement(`script`),ft(a),Rd(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function Mf(e,t){xf.M(e,t);var n=wf;if(n&&e){var r=dt(n).hoistableScripts,i=Rf(e),a=r.get(i);a||(a=n.querySelector(zf(i)),a||(e=h({src:e,async:!0,type:`module`},t),(t=vf.get(i))&&Uf(e,t),a=n.createElement(`script`),ft(a),Rd(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function Nf(e,t,n,r){var a=(a=H.current)?bf(a):null;if(!a)throw Error(i(446));switch(e){case`meta`:case`title`:return null;case`style`:return typeof n.precedence==`string`&&typeof n.href==`string`?(t=Pf(n.href),n=dt(a).hoistableStyles,r=n.get(t),r||(r={type:`style`,instance:null,count:0,state:null},n.set(t,r)),r):{type:`void`,instance:null,count:0,state:null};case`link`:if(n.rel===`stylesheet`&&typeof n.href==`string`&&typeof n.precedence==`string`){e=Pf(n.href);var o=dt(a).hoistableStyles,s=o.get(e);if(s||(a=a.ownerDocument||a,s={type:`stylesheet`,instance:null,count:0,state:{loading:0,preload:null}},o.set(e,s),(o=a.querySelector(Ff(e)))&&!o._p&&(s.instance=o,s.state.loading=5),vf.has(e)||(n={rel:`preload`,as:`style`,href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},vf.set(e,n),o||Lf(a,e,n,s.state))),t&&r===null)throw Error(i(528,``));return s}if(t&&r!==null)throw Error(i(529,``));return null;case`script`:return t=n.async,n=n.src,typeof n==`string`&&t&&typeof t!=`function`&&typeof t!=`symbol`?(t=Rf(n),n=dt(a).hoistableScripts,r=n.get(t),r||(r={type:`script`,instance:null,count:0,state:null},n.set(t,r)),r):{type:`void`,instance:null,count:0,state:null};default:throw Error(i(444,e))}}function Pf(e){return`href="`+At(e)+`"`}function Ff(e){return`link[rel="stylesheet"][`+e+`]`}function If(e){return h({},e,{"data-precedence":e.precedence,precedence:null})}function Lf(e,t,n,r){e.querySelector(`link[rel="preload"][as="style"][`+t+`]`)?r.loading=1:(t=e.createElement(`link`),r.preload=t,t.addEventListener(`load`,function(){return r.loading|=1}),t.addEventListener(`error`,function(){return r.loading|=2}),Rd(t,`link`,n),ft(t),e.head.appendChild(t))}function Rf(e){return`[src="`+At(e)+`"]`}function zf(e){return`script[async]`+e}function Bf(e,t,n){if(t.count++,t.instance===null)switch(t.type){case`style`:var r=e.querySelector(`style[data-href~="`+At(n.href)+`"]`);if(r)return t.instance=r,ft(r),r;var a=h({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return r=(e.ownerDocument||e).createElement(`style`),ft(r),Rd(r,`style`,a),Vf(r,n.precedence,e),t.instance=r;case`stylesheet`:a=Pf(n.href);var o=e.querySelector(Ff(a));if(o)return t.state.loading|=4,t.instance=o,ft(o),o;r=If(n),(a=vf.get(a))&&Hf(r,a),o=(e.ownerDocument||e).createElement(`link`),ft(o);var s=o;return s._p=new Promise(function(e,t){s.onload=e,s.onerror=t}),Rd(o,`link`,r),t.state.loading|=4,Vf(o,n.precedence,e),t.instance=o;case`script`:return o=Rf(n.src),(a=e.querySelector(zf(o)))?(t.instance=a,ft(a),a):(r=n,(a=vf.get(o))&&(r=h({},n),Uf(r,a)),e=e.ownerDocument||e,a=e.createElement(`script`),ft(a),Rd(a,`link`,r),e.head.appendChild(a),t.instance=a);case`void`:return null;default:throw Error(i(443,t.type))}else t.type===`stylesheet`&&!(t.state.loading&4)&&(r=t.instance,t.state.loading|=4,Vf(r,n.precedence,e));return t.instance}function Vf(e,t,n){for(var r=n.querySelectorAll(`link[rel="stylesheet"][data-precedence],style[data-precedence]`),i=r.length?r[r.length-1]:null,a=i,o=0;o<r.length;o++){var s=r[o];if(s.dataset.precedence===t)a=s;else if(a!==i)break}a?a.parentNode.insertBefore(e,a.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function Hf(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.title??=t.title}function Uf(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.integrity??=t.integrity}var Wf=null;function Gf(e,t,n){if(Wf===null){var r=new Map,i=Wf=new Map;i.set(n,r)}else i=Wf,r=i.get(n),r||(r=new Map,i.set(n,r));if(r.has(e))return r;for(r.set(e,null),n=n.getElementsByTagName(e),i=0;i<n.length;i++){var a=n[i];if(!(a[ot]||a[$e]||e===`link`&&a.getAttribute(`rel`)===`stylesheet`)&&a.namespaceURI!==`http://www.w3.org/2000/svg`){var o=a.getAttribute(t)||``;o=e+o;var s=r.get(o);s?s.push(a):r.set(o,[a])}}return r}function Kf(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t===`title`?e.querySelector(`head > title`):null)}function qf(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case`meta`:case`title`:return!0;case`style`:if(typeof t.precedence!=`string`||typeof t.href!=`string`||t.href===``)break;return!0;case`link`:if(typeof t.rel!=`string`||typeof t.href!=`string`||t.href===``||t.onLoad||t.onError)break;switch(t.rel){case`stylesheet`:return e=t.disabled,typeof t.precedence==`string`&&e==null;default:return!0}case`script`:if(t.async&&typeof t.async!=`function`&&typeof t.async!=`symbol`&&!t.onLoad&&!t.onError&&t.src&&typeof t.src==`string`)return!0}return!1}function Jf(e){return!(e.type===`stylesheet`&&!(e.state.loading&3))}function Yf(e,t,n,r){if(n.type===`stylesheet`&&(typeof r.media!=`string`||!1!==matchMedia(r.media).matches)&&!(n.state.loading&4)){if(n.instance===null){var i=Pf(r.href),a=t.querySelector(Ff(i));if(a){t=a._p,typeof t==`object`&&t&&typeof t.then==`function`&&(e.count++,e=Qf.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=a,ft(a);return}a=t.ownerDocument||t,r=If(r),(i=vf.get(i))&&Hf(r,i),a=a.createElement(`link`),ft(a);var o=a;o._p=new Promise(function(e,t){o.onload=e,o.onerror=t}),Rd(a,`link`,r),n.instance=a}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&!(n.state.loading&3)&&(e.count++,n=Qf.bind(e),t.addEventListener(`load`,n),t.addEventListener(`error`,n))}}var Xf=0;function Zf(e,t){return e.stylesheets&&e.count===0&&ep(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var r=setTimeout(function(){if(e.stylesheets&&ep(e,e.stylesheets),e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}},6e4+t);0<e.imgBytes&&Xf===0&&(Xf=62500*Vd());var i=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&ep(e,e.stylesheets),e.unsuspend)){var t=e.unsuspend;e.unsuspend=null,t()}},(e.imgBytes>Xf?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(r),clearTimeout(i)}}:null}function Qf(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)ep(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var $f=null;function ep(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,$f=new Map,t.forEach(tp,e),$f=null,Qf.call(e))}function tp(e,t){if(!(t.state.loading&4)){var n=$f.get(e);if(n)var r=n.get(null);else{n=new Map,$f.set(e,n);for(var i=e.querySelectorAll(`link[data-precedence],style[data-precedence]`),a=0;a<i.length;a++){var o=i[a];(o.nodeName===`LINK`||o.getAttribute(`media`)!==`not all`)&&(n.set(o.dataset.precedence,o),r=o)}r&&n.set(null,r)}i=t.instance,o=i.getAttribute(`data-precedence`),a=n.get(o)||r,a===r&&n.set(null,i),n.set(o,i),this.count++,r=Qf.bind(this),i.addEventListener(`load`,r),i.addEventListener(`error`,r),a?a.parentNode.insertBefore(i,a.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(i,e.firstChild)),t.state.loading|=4}}var np={$$typeof:C,Provider:null,Consumer:null,_currentValue:te,_currentValue2:te,_threadCount:0};function rp(e,t,n,r,i,a,o,s,c){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=He(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=He(0),this.hiddenUpdates=He(null),this.identifierPrefix=r,this.onUncaughtError=i,this.onCaughtError=a,this.onRecoverableError=o,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=c,this.incompleteTransitions=new Map}function ip(e,t,n,r,i,a,o,s,c,l,u,d){return e=new rp(e,t,n,o,c,l,u,d,s),t=1,!0===a&&(t|=24),a=$r(3,null,null,t),e.current=a,a.stateNode=e,t=$i(),t.refCount++,e.pooledCache=t,t.refCount++,a.memoizedState={element:r,isDehydrated:n,cache:t},Ma(a),e}function ap(e){return e?(e=Zr,e):Zr}function op(e,t,n,r,i,a){i=ap(i),r.context===null?r.context=i:r.pendingContext=i,r=Pa(t),r.payload={element:n},a=a===void 0?null:a,a!==null&&(r.callback=a),n=Fa(e,r,t),n!==null&&(gu(n,e,t),Ia(n,e,t))}function sp(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function cp(e,t){sp(e,t),(e=e.alternate)&&sp(e,t)}function lp(e){if(e.tag===13||e.tag===31){var t=Jr(e,67108864);t!==null&&gu(t,e,67108864),cp(e,67108864)}}function up(e){if(e.tag===13||e.tag===31){var t=mu();t=Je(t);var n=Jr(e,t);n!==null&&gu(n,e,t),cp(e,t)}}var dp=!0;function fp(e,t,n,r){var i=F.T;F.T=null;var a=I.p;try{I.p=2,mp(e,t,n,r)}finally{I.p=a,F.T=i}}function pp(e,t,n,r){var i=F.T;F.T=null;var a=I.p;try{I.p=8,mp(e,t,n,r)}finally{I.p=a,F.T=i}}function mp(e,t,n,r){if(dp){var i=hp(r);if(i===null)Dd(e,t,r,gp,n),Dp(e,r);else if(kp(i,e,t,n,r))r.stopPropagation();else if(Dp(e,r),t&4&&-1<Ep.indexOf(e)){for(;i!==null;){var a=lt(i);if(a!==null)switch(a.tag){case 3:if(a=a.stateNode,a.current.memoizedState.isDehydrated){var o=Le(a.pendingLanes);if(o!==0){var s=a;for(s.pendingLanes|=2,s.entangledLanes|=2;o;){var c=1<<31-Ae(o);s.entanglements[1]|=c,o&=~c}ad(a),!(Fl&6)&&(nu=ye()+500,od(0,!1))}}break;case 31:case 13:s=Jr(a,2),s!==null&&gu(s,a,2),xu(),cp(a,2)}if(a=hp(r),a===null&&Dd(e,t,r,gp,n),a===i)break;i=a}i!==null&&r.stopPropagation()}else Dd(e,t,r,null,n)}}function hp(e){return e=qt(e),_p(e)}var gp=null;function _p(e){if(gp=null,e=ct(e),e!==null){var t=o(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=s(t),e!==null)return e;e=null}else if(n===31){if(e=c(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return gp=e,null}function vp(e){switch(e){case`beforetoggle`:case`cancel`:case`click`:case`close`:case`contextmenu`:case`copy`:case`cut`:case`auxclick`:case`dblclick`:case`dragend`:case`dragstart`:case`drop`:case`focusin`:case`focusout`:case`input`:case`invalid`:case`keydown`:case`keypress`:case`keyup`:case`mousedown`:case`mouseup`:case`paste`:case`pause`:case`play`:case`pointercancel`:case`pointerdown`:case`pointerup`:case`ratechange`:case`reset`:case`resize`:case`seeked`:case`submit`:case`toggle`:case`touchcancel`:case`touchend`:case`touchstart`:case`volumechange`:case`change`:case`selectionchange`:case`textInput`:case`compositionstart`:case`compositionend`:case`compositionupdate`:case`beforeblur`:case`afterblur`:case`beforeinput`:case`blur`:case`fullscreenchange`:case`focus`:case`hashchange`:case`popstate`:case`select`:case`selectstart`:return 2;case`drag`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`mousemove`:case`mouseout`:case`mouseover`:case`pointermove`:case`pointerout`:case`pointerover`:case`scroll`:case`touchmove`:case`wheel`:case`mouseenter`:case`mouseleave`:case`pointerenter`:case`pointerleave`:return 8;case`message`:switch(be()){case xe:return 2;case Se:return 8;case Ce:case we:return 32;case Te:return 268435456;default:return 32}default:return 32}}var yp=!1,bp=null,xp=null,Sp=null,Cp=new Map,wp=new Map,Tp=[],Ep=`mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(` `);function Dp(e,t){switch(e){case`focusin`:case`focusout`:bp=null;break;case`dragenter`:case`dragleave`:xp=null;break;case`mouseover`:case`mouseout`:Sp=null;break;case`pointerover`:case`pointerout`:Cp.delete(t.pointerId);break;case`gotpointercapture`:case`lostpointercapture`:wp.delete(t.pointerId)}}function Op(e,t,n,r,i,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:a,targetContainers:[i]},t!==null&&(t=lt(t),t!==null&&lp(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,i!==null&&t.indexOf(i)===-1&&t.push(i),e)}function kp(e,t,n,r,i){switch(t){case`focusin`:return bp=Op(bp,e,t,n,r,i),!0;case`dragenter`:return xp=Op(xp,e,t,n,r,i),!0;case`mouseover`:return Sp=Op(Sp,e,t,n,r,i),!0;case`pointerover`:var a=i.pointerId;return Cp.set(a,Op(Cp.get(a)||null,e,t,n,r,i)),!0;case`gotpointercapture`:return a=i.pointerId,wp.set(a,Op(wp.get(a)||null,e,t,n,r,i)),!0}return!1}function Ap(e){var t=ct(e.target);if(t!==null){var n=o(t);if(n!==null){if(t=n.tag,t===13){if(t=s(n),t!==null){e.blockedOn=t,Ze(e.priority,function(){up(n)});return}}else if(t===31){if(t=c(n),t!==null){e.blockedOn=t,Ze(e.priority,function(){up(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function jp(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=hp(e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);Kt=r,n.target.dispatchEvent(r),Kt=null}else return t=lt(n),t!==null&&lp(t),e.blockedOn=n,!1;t.shift()}return!0}function Mp(e,t,n){jp(e)&&n.delete(t)}function Np(){yp=!1,bp!==null&&jp(bp)&&(bp=null),xp!==null&&jp(xp)&&(xp=null),Sp!==null&&jp(Sp)&&(Sp=null),Cp.forEach(Mp),wp.forEach(Mp)}function Pp(e,n){e.blockedOn===n&&(e.blockedOn=null,yp||(yp=!0,t.unstable_scheduleCallback(t.unstable_NormalPriority,Np)))}var Fp=null;function Ip(e){Fp!==e&&(Fp=e,t.unstable_scheduleCallback(t.unstable_NormalPriority,function(){Fp===e&&(Fp=null);for(var t=0;t<e.length;t+=3){var n=e[t],r=e[t+1],i=e[t+2];if(typeof r!=`function`){if(_p(r||n)===null)continue;break}var a=lt(n);a!==null&&(e.splice(t,3),t-=3,vs(a,{pending:!0,data:i,method:n.method,action:r},r,i))}}))}function Lp(e){function t(t){return Pp(t,e)}bp!==null&&Pp(bp,e),xp!==null&&Pp(xp,e),Sp!==null&&Pp(Sp,e),Cp.forEach(t),wp.forEach(t);for(var n=0;n<Tp.length;n++){var r=Tp[n];r.blockedOn===e&&(r.blockedOn=null)}for(;0<Tp.length&&(n=Tp[0],n.blockedOn===null);)Ap(n),n.blockedOn===null&&Tp.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(r=0;r<n.length;r+=3){var i=n[r],a=n[r+1],o=i[et]||null;if(typeof a==`function`)o||Ip(n);else if(o){var s=null;if(a&&a.hasAttribute(`formAction`)){if(i=a,o=a[et]||null)s=o.formAction;else if(_p(i)!==null)continue}else s=o.action;typeof s==`function`?n[r+1]=s:(n.splice(r,3),r-=3),Ip(n)}}}function Rp(){function e(e){e.canIntercept&&e.info===`react-transition`&&e.intercept({handler:function(){return new Promise(function(e){return i=e})},focusReset:`manual`,scroll:`manual`})}function t(){i!==null&&(i(),i=null),r||setTimeout(n,20)}function n(){if(!r&&!navigation.transition){var e=navigation.currentEntry;e&&e.url!=null&&navigation.navigate(e.url,{state:e.getState(),info:`react-transition`,history:`replace`})}}if(typeof navigation==`object`){var r=!1,i=null;return navigation.addEventListener(`navigate`,e),navigation.addEventListener(`navigatesuccess`,t),navigation.addEventListener(`navigateerror`,t),setTimeout(n,100),function(){r=!0,navigation.removeEventListener(`navigate`,e),navigation.removeEventListener(`navigatesuccess`,t),navigation.removeEventListener(`navigateerror`,t),i!==null&&(i(),i=null)}}}function zp(e){this._internalRoot=e}Bp.prototype.render=zp.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(i(409));var n=t.current;op(n,mu(),e,t,null,null)},Bp.prototype.unmount=zp.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;op(e.current,2,null,e,null,null),xu(),t[tt]=null}};function Bp(e){this._internalRoot=e}Bp.prototype.unstable_scheduleHydration=function(e){if(e){var t=Xe();e={blockedOn:null,target:e,priority:t};for(var n=0;n<Tp.length&&t!==0&&t<Tp[n].priority;n++);Tp.splice(n,0,e),n===0&&Ap(e)}};var Vp=n.version;if(Vp!==`19.2.8`)throw Error(i(527,Vp,`19.2.8`));I.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render==`function`?Error(i(188)):(e=Object.keys(e).join(`,`),Error(i(268,e)));return e=d(t),e=e===null?null:p(e),e=e===null?null:e.stateNode,e};var Hp={bundleType:0,version:`19.2.8`,rendererPackageName:`react-dom`,currentDispatcherRef:F,reconcilerVersion:`19.2.8`};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`){var Up=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Up.isDisabled&&Up.supportsFiber)try{De=Up.inject(Hp),Oe=Up}catch{}}e.createRoot=function(e,t){if(!a(e))throw Error(i(299));var n=!1,r=``,o=Vs,s=Hs,c=Us;return t!=null&&(!0===t.unstable_strictMode&&(n=!0),t.identifierPrefix!==void 0&&(r=t.identifierPrefix),t.onUncaughtError!==void 0&&(o=t.onUncaughtError),t.onCaughtError!==void 0&&(s=t.onCaughtError),t.onRecoverableError!==void 0&&(c=t.onRecoverableError)),t=ip(e,1,!1,null,null,n,r,null,o,s,c,Rp),e[tt]=t.current,Td(e),new zp(t)}})),g=o(((e,t)=>{function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>`u`||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!=`function`))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=h()})),_=e=>{let t,n=new Set,r=(e,r)=>{let i=typeof e==`function`?e(t):e;if(!Object.is(i,t)){let e=t;t=r??(typeof i!=`object`||!i)?i:Object.assign({},t,i),n.forEach(n=>n(t,e))}},i=()=>t,a={setState:r,getState:i,getInitialState:()=>o,subscribe:e=>(n.add(e),()=>n.delete(e))},o=t=e(r,i,a);return a},v=(e=>e?_(e):_),y=c(u(),1),b=e=>e;function x(e,t=b){let n=y.useSyncExternalStore(e.subscribe,y.useCallback(()=>t(e.getState()),[e,t]),y.useCallback(()=>t(e.getInitialState()),[e,t]));return y.useDebugValue(n),n}var S=e=>{let t=v(e),n=e=>x(t,e);return Object.assign(n,t),n},C=(e=>e?S(e):S),w=g(),T={};T.version=`0.20.3`;var E=1200,D=1252,O,k=[874,932,936,949,950,1250,1251,1252,1253,1254,1255,1256,1257,1258,1e4],A={0:1252,1:65001,2:65001,77:1e4,128:932,129:949,130:1361,134:936,136:950,161:1253,162:1254,163:1258,177:1255,178:1256,186:1257,204:1251,222:874,238:1250,255:1252,69:6969},j=function(e){k.indexOf(e)!=-1&&(D=A[0]=e)};function M(){j(1252)}var N=function(e){E=e,j(e)};function P(){N(1200),M()}function ee(e){for(var t=[],n=0,r=e.length;n<r;++n)t[n]=e.charCodeAt(n);return t}function F(e){for(var t=[],n=0;n<e.length>>1;++n)t[n]=String.fromCharCode(e.charCodeAt(2*n)+(e.charCodeAt(2*n+1)<<8));return t.join(``)}function I(e){for(var t=[],n=0;n<e.length>>1;++n)t[n]=String.fromCharCode(e[2*n]+(e[2*n+1]<<8));return t.join(``)}function te(e){for(var t=[],n=0;n<e.length>>1;++n)t[n]=String.fromCharCode(e.charCodeAt(2*n+1)+(e.charCodeAt(2*n)<<8));return t.join(``)}var ne=function(e){var t=e.charCodeAt(0),n=e.charCodeAt(1);return t==255&&n==254?F(e.slice(2)):t==254&&n==255?te(e.slice(2)):t==65279?e.slice(1):e},L=function(e){return String.fromCharCode(e)},R=function(e){return String.fromCharCode(e)},z=null,B=!0,V=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=`;function re(e){for(var t=``,n=0,r=0,i=0,a=0,o=0,s=0,c=0,l=0;l<e.length;)n=e.charCodeAt(l++),a=n>>2,r=e.charCodeAt(l++),o=(n&3)<<4|r>>4,i=e.charCodeAt(l++),s=(r&15)<<2|i>>6,c=i&63,isNaN(r)?s=c=64:isNaN(i)&&(c=64),t+=V.charAt(a)+V.charAt(o)+V.charAt(s)+V.charAt(c);return t}function H(e){var t=``,n=0,r=0,i=0,a=0,o=0,s=0,c=0;if(e.slice(0,5)==`data:`){var l=e.slice(0,1024).indexOf(`;base64,`);l>-1&&(e=e.slice(l+8))}e=e.replace(/[^\w\+\/\=]/g,``);for(var l=0;l<e.length;)a=V.indexOf(e.charAt(l++)),o=V.indexOf(e.charAt(l++)),n=a<<2|o>>4,t+=String.fromCharCode(n),s=V.indexOf(e.charAt(l++)),r=(o&15)<<4|s>>2,s!==64&&(t+=String.fromCharCode(r)),c=V.indexOf(e.charAt(l++)),i=(s&3)<<6|c,c!==64&&(t+=String.fromCharCode(i));return t}var U=(function(){return typeof Buffer<`u`&&typeof process<`u`&&process.versions!==void 0&&!!process.versions.node})(),ie=(function(){if(typeof Buffer<`u`){var e=!Buffer.from;if(!e)try{Buffer.from(`foo`,`utf8`)}catch{e=!0}return e?function(e,t){return t?new Buffer(e,t):new Buffer(e)}:Buffer.from.bind(Buffer)}return function(){}})(),ae=(function(){if(typeof Buffer>`u`)return!1;var e=ie([65,0]);return e?e.toString(`utf16le`).length==1:!1})();function oe(e){return U?Buffer.alloc?Buffer.alloc(e):new Buffer(e):typeof Uint8Array<`u`?new Uint8Array(e):Array(e)}function W(e){return U?Buffer.allocUnsafe?Buffer.allocUnsafe(e):new Buffer(e):typeof Uint8Array<`u`?new Uint8Array(e):Array(e)}var se=function(e){return U?ie(e,`binary`):e.split(``).map(function(e){return e.charCodeAt(0)&255})};function ce(e){if(Array.isArray(e))return e.map(function(e){return String.fromCharCode(e)}).join(``);for(var t=[],n=0;n<e.length;++n)t[n]=String.fromCharCode(e[n]);return t.join(``)}function le(e){if(typeof ArrayBuffer>`u`)throw Error(`Unsupported`);if(e instanceof ArrayBuffer)return le(new Uint8Array(e));for(var t=Array(e.length),n=0;n<e.length;++n)t[n]=e[n];return t}var ue=U?function(e){return Buffer.concat(e.map(function(e){return Buffer.isBuffer(e)?e:ie(e)}))}:function(e){if(typeof Uint8Array<`u`){var t=0,n=0;for(t=0;t<e.length;++t)n+=e[t].length;var r=new Uint8Array(n),i=0;for(t=0,n=0;t<e.length;n+=i,++t)i=e[t].length,e[t]instanceof Uint8Array?r.set(e[t],n):typeof e[t]==`string`?r.set(new Uint8Array(se(e[t])),n):r.set(new Uint8Array(e[t]),n);return r}return[].concat.apply([],e.map(function(e){return Array.isArray(e)?e:[].slice.call(e)}))};function de(e){for(var t=[],n=0,r=e.length+250,i=oe(e.length+255),a=0;a<e.length;++a){var o=e.charCodeAt(a);if(o<128)i[n++]=o;else if(o<2048)i[n++]=192|o>>6&31,i[n++]=128|o&63;else if(o>=55296&&o<57344){o=(o&1023)+64;var s=e.charCodeAt(++a)&1023;i[n++]=240|o>>8&7,i[n++]=128|o>>2&63,i[n++]=128|s>>6&15|(o&3)<<4,i[n++]=128|s&63}else i[n++]=224|o>>12&15,i[n++]=128|o>>6&63,i[n++]=128|o&63;n>r&&(t.push(i.slice(0,n)),n=0,i=oe(65535),r=65530)}return t.push(i.slice(0,n)),ue(t)}var fe=/\u0000/g,pe=/[\u0001-\u0006]/g;function me(e){for(var t=``,n=e.length-1;n>=0;)t+=e.charAt(n--);return t}function he(e,t){var n=``+e;return n.length>=t?n:Bt(`0`,t-n.length)+n}function ge(e,t){var n=``+e;return n.length>=t?n:Bt(` `,t-n.length)+n}function _e(e,t){var n=``+e;return n.length>=t?n:n+Bt(` `,t-n.length)}function ve(e,t){var n=``+Math.round(e);return n.length>=t?n:Bt(`0`,t-n.length)+n}function ye(e,t){var n=``+e;return n.length>=t?n:Bt(`0`,t-n.length)+n}var be=2**32;function xe(e,t){return e>be||e<-be?ve(e,t):ye(Math.round(e),t)}function Se(e,t){return t||=0,e.length>=7+t&&(e.charCodeAt(t)|32)==103&&(e.charCodeAt(t+1)|32)==101&&(e.charCodeAt(t+2)|32)==110&&(e.charCodeAt(t+3)|32)==101&&(e.charCodeAt(t+4)|32)==114&&(e.charCodeAt(t+5)|32)==97&&(e.charCodeAt(t+6)|32)==108}var Ce=[[`Sun`,`Sunday`],[`Mon`,`Monday`],[`Tue`,`Tuesday`],[`Wed`,`Wednesday`],[`Thu`,`Thursday`],[`Fri`,`Friday`],[`Sat`,`Saturday`]],we=[[`J`,`Jan`,`January`],[`F`,`Feb`,`February`],[`M`,`Mar`,`March`],[`A`,`Apr`,`April`],[`M`,`May`,`May`],[`J`,`Jun`,`June`],[`J`,`Jul`,`July`],[`A`,`Aug`,`August`],[`S`,`Sep`,`September`],[`O`,`Oct`,`October`],[`N`,`Nov`,`November`],[`D`,`Dec`,`December`]];function Te(e){return e||={},e[0]=`General`,e[1]=`0`,e[2]=`0.00`,e[3]=`#,##0`,e[4]=`#,##0.00`,e[9]=`0%`,e[10]=`0.00%`,e[11]=`0.00E+00`,e[12]=`# ?/?`,e[13]=`# ??/??`,e[14]=`m/d/yy`,e[15]=`d-mmm-yy`,e[16]=`d-mmm`,e[17]=`mmm-yy`,e[18]=`h:mm AM/PM`,e[19]=`h:mm:ss AM/PM`,e[20]=`h:mm`,e[21]=`h:mm:ss`,e[22]=`m/d/yy h:mm`,e[37]=`#,##0 ;(#,##0)`,e[38]=`#,##0 ;[Red](#,##0)`,e[39]=`#,##0.00;(#,##0.00)`,e[40]=`#,##0.00;[Red](#,##0.00)`,e[45]=`mm:ss`,e[46]=`[h]:mm:ss`,e[47]=`mmss.0`,e[48]=`##0.0E+0`,e[49]=`@`,e[56]=`"上午/下午 "hh"時"mm"分"ss"秒 "`,e}var G={0:`General`,1:`0`,2:`0.00`,3:`#,##0`,4:`#,##0.00`,9:`0%`,10:`0.00%`,11:`0.00E+00`,12:`# ?/?`,13:`# ??/??`,14:`m/d/yy`,15:`d-mmm-yy`,16:`d-mmm`,17:`mmm-yy`,18:`h:mm AM/PM`,19:`h:mm:ss AM/PM`,20:`h:mm`,21:`h:mm:ss`,22:`m/d/yy h:mm`,37:`#,##0 ;(#,##0)`,38:`#,##0 ;[Red](#,##0)`,39:`#,##0.00;(#,##0.00)`,40:`#,##0.00;[Red](#,##0.00)`,45:`mm:ss`,46:`[h]:mm:ss`,47:`mmss.0`,48:`##0.0E+0`,49:`@`,56:`"上午/下午 "hh"時"mm"分"ss"秒 "`},Ee={5:37,6:38,7:39,8:40,23:0,24:0,25:0,26:0,27:14,28:14,29:14,30:14,31:14,50:14,51:14,52:14,53:14,54:14,55:14,56:14,57:14,58:14,59:1,60:2,61:3,62:4,67:9,68:10,69:12,70:13,71:14,72:14,73:15,74:16,75:17,76:20,77:21,78:22,79:45,80:46,81:47,82:0},De={5:`"$"#,##0_);\\("$"#,##0\\)`,63:`"$"#,##0_);\\("$"#,##0\\)`,6:`"$"#,##0_);[Red]\\("$"#,##0\\)`,64:`"$"#,##0_);[Red]\\("$"#,##0\\)`,7:`"$"#,##0.00_);\\("$"#,##0.00\\)`,65:`"$"#,##0.00_);\\("$"#,##0.00\\)`,8:`"$"#,##0.00_);[Red]\\("$"#,##0.00\\)`,66:`"$"#,##0.00_);[Red]\\("$"#,##0.00\\)`,41:`_(* #,##0_);_(* \\(#,##0\\);_(* "-"_);_(@_)`,42:`_("$"* #,##0_);_("$"* \\(#,##0\\);_("$"* "-"_);_(@_)`,43:`_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)`,44:`_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)`};function Oe(e,t,n){for(var r=e<0?-1:1,i=e*r,a=0,o=1,s=0,c=1,l=0,u=0,d=Math.floor(i);l<t&&(d=Math.floor(i),s=d*o+a,u=d*l+c,!(i-d<5e-8));)i=1/(i-d),a=o,o=s,c=l,l=u;if(u>t&&(l>t?(u=c,s=a):(u=l,s=o)),!n)return[0,r*s,u];var f=Math.floor(r*s/u);return[f,r*s-f*u,u]}function ke(e){var t=e.toPrecision(16);if(t.indexOf(`e`)>-1){var n=t.slice(0,t.indexOf(`e`));return n=n.indexOf(`.`)>-1?n.slice(0,n.slice(0,2)==`0.`?17:16):n.slice(0,15)+Bt(`0`,n.length-15),n+t.slice(t.indexOf(`e`))}var r=t.indexOf(`.`)>-1?t.slice(0,t.slice(0,2)==`0.`?17:16):t.slice(0,15)+Bt(`0`,t.length-15);return Number(r)}function Ae(e,t,n){if(e>2958465||e<0)return null;e=ke(e);var r=e|0,i=Math.floor(86400*(e-r)),a=0,o=[],s={D:r,T:i,u:86400*(e-r)-i,y:0,m:0,d:0,H:0,M:0,S:0,q:0};if(Math.abs(s.u)<1e-6&&(s.u=0),t&&t.date1904&&(r+=1462),s.u>.9999&&(s.u=0,++i==86400&&(s.T=i=0,++r,++s.D)),r===60)o=n?[1317,10,29]:[1900,2,29],a=3;else if(r===0)o=n?[1317,8,29]:[1900,1,0],a=6;else{r>60&&--r;var c=new Date(1900,0,1);c.setDate(c.getDate()+r-1),o=[c.getFullYear(),c.getMonth()+1,c.getDate()],a=c.getDay(),r<60&&(a=(a+6)%7),n&&(a=Le(c,o))}return s.y=o[0],s.m=o[1],s.d=o[2],s.S=i%60,i=Math.floor(i/60),s.M=i%60,i=Math.floor(i/60),s.H=i,s.q=a,s}function je(e){return e.indexOf(`.`)==-1?e:e.replace(/(?:\.0*|(\.\d*[1-9])0+)$/,`$1`)}function Me(e){return e.indexOf(`E`)==-1?e:e.replace(/(?:\.0*|(\.\d*[1-9])0+)[Ee]/,`$1E`).replace(/(E[+-])(\d)$/,`$10$2`)}function Ne(e){var t=e<0?12:11,n=je(e.toFixed(12));return n.length<=t||(n=e.toPrecision(10),n.length<=t)?n:e.toExponential(5)}function Pe(e){var t=je(e.toFixed(11));return t.length>(e<0?12:11)||t===`0`||t===`-0`?e.toPrecision(6):t}function Fe(e){if(!isFinite(e))return isNaN(e)?`#NUM!`:`#DIV/0!`;var t=Math.floor(Math.log(Math.abs(e))*Math.LOG10E);return je(Me((t>=-4&&t<=-1?e.toPrecision(10+t):Math.abs(t)<=9?Ne(e):t===10?e.toFixed(10).substr(0,12):Pe(e)).toUpperCase()))}function Ie(e,t){switch(typeof e){case`string`:return e;case`boolean`:return e?`TRUE`:`FALSE`;case`number`:return(e|0)===e?e.toString(10):Fe(e);case`undefined`:return``;case`object`:if(e==null)return``;if(e instanceof Date)return mt(14,jt(e,t&&t.date1904),t)}throw Error(`unsupported value in General format: `+e)}function Le(e,t){t[0]-=581;var n=e.getDay();return e<60&&(n=(n+6)%7),n}function Re(e,t,n,r){var i=``,a=0,o=0,s=n.y,c,l=0;switch(e){case 98:s=n.y+543;case 121:switch(t.length){case 1:case 2:c=s%100,l=2;break;default:c=s%1e4,l=4;break}break;case 109:switch(t.length){case 1:case 2:c=n.m,l=t.length;break;case 3:return we[n.m-1][1];case 5:return we[n.m-1][0];default:return we[n.m-1][2]}break;case 100:switch(t.length){case 1:case 2:c=n.d,l=t.length;break;case 3:return Ce[n.q][0];default:return Ce[n.q][1]}break;case 104:switch(t.length){case 1:case 2:c=1+(n.H+11)%12,l=t.length;break;default:throw`bad hour format: `+t}break;case 72:switch(t.length){case 1:case 2:c=n.H,l=t.length;break;default:throw`bad hour format: `+t}break;case 77:switch(t.length){case 1:case 2:c=n.M,l=t.length;break;default:throw`bad minute format: `+t}break;case 115:if(t!=`s`&&t!=`ss`&&t!=`.0`&&t!=`.00`&&t!=`.000`)throw`bad second format: `+t;return n.u===0&&(t==`s`||t==`ss`)?he(n.S,t.length):(o=r>=2?r===3?1e3:100:r===1?10:1,a=Math.round(o*(n.S+n.u)),a>=60*o&&(a=0),t===`s`?a===0?`0`:``+a/o:(i=he(a,2+r),t===`ss`?i.substr(0,2):`.`+i.substr(2,t.length-1)));case 90:switch(t){case`[h]`:case`[hh]`:c=n.D*24+n.H;break;case`[m]`:case`[mm]`:c=(n.D*24+n.H)*60+n.M;break;case`[s]`:case`[ss]`:c=((n.D*24+n.H)*60+n.M)*60+(r==0?Math.round(n.S+n.u):n.S);break;default:throw`bad abstime format: `+t}l=t.length===3?1:2;break;case 101:c=s,l=1;break}return l>0?he(c,l):``}function ze(e){var t=3;if(e.length<=t)return e;for(var n=e.length%t,r=e.substr(0,n);n!=e.length;n+=t)r+=(r.length>0?`,`:``)+e.substr(n,t);return r}var Be=/%/g;function Ve(e,t,n){var r=t.replace(Be,``),i=t.length-r.length;return ot(e,r,n*10**(2*i))+Bt(`%`,i)}function He(e,t,n){for(var r=t.length-1;t.charCodeAt(r-1)===44;)--r;return ot(e,t.substr(0,r),n/10**(3*(t.length-r)))}function Ue(e,t){var n,r=e.indexOf(`E`)-e.indexOf(`.`)-1;if(e.match(/^#+0.0E\+0$/)){if(t==0)return`0.0E+0`;if(t<0)return`-`+Ue(e,-t);var i=e.indexOf(`.`);i===-1&&(i=e.indexOf(`E`));var a=Math.floor(Math.log(t)*Math.LOG10E)%i;if(a<0&&(a+=i),n=(t/10**a).toPrecision(r+1+(i+a)%i),n.indexOf(`e`)===-1){var o=Math.floor(Math.log(t)*Math.LOG10E);for(n.indexOf(`.`)===-1?n=n.charAt(0)+`.`+n.substr(1)+`E+`+(o-n.length+a):n+=`E+`+(o-a);n.substr(0,2)===`0.`;)n=n.charAt(0)+n.substr(2,i)+`.`+n.substr(2+i),n=n.replace(/^0+([1-9])/,`$1`).replace(/^0+\./,`0.`);n=n.replace(/\+-/,`-`)}n=n.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/,function(e,t,n,r){return t+n+r.substr(0,(i+a)%i)+`.`+r.substr(a)+`E`})}else n=t.toExponential(r);return e.match(/E\+00$/)&&n.match(/e[+-]\d$/)&&(n=n.substr(0,n.length-1)+`0`+n.charAt(n.length-1)),e.match(/E\-/)&&n.match(/e\+/)&&(n=n.replace(/e\+/,`e`)),n.replace(`e`,`E`)}var We=/# (\?+)( ?)\/( ?)(\d+)/;function Ge(e,t,n){var r=parseInt(e[4],10),i=Math.round(t*r),a=Math.floor(i/r),o=i-a*r,s=r;return n+(a===0?``:``+a)+` `+(o===0?Bt(` `,e[1].length+1+e[4].length):ge(o,e[1].length)+e[2]+`/`+e[3]+he(s,e[4].length))}function Ke(e,t,n){return n+(t===0?``:``+t)+Bt(` `,e[1].length+2+e[4].length)}var qe=/^#*0*\.([0#]+)/,Je=/\)[^)]*[0#]/,Ye=/\(###\) ###\\?-####/;function Xe(e){for(var t=``,n,r=0;r!=e.length;++r)switch(n=e.charCodeAt(r)){case 35:break;case 63:t+=` `;break;case 48:t+=`0`;break;default:t+=String.fromCharCode(n)}return t}function Ze(e,t){var n=10**t;return``+Math.round(e*n)/n}function Qe(e,t){var n=e-Math.floor(e),r=10**t;return t<(``+Math.round(n*r)).length?0:Math.round(n*r)}function $e(e,t){return+(t<(``+Math.round((e-Math.floor(e))*10**t)).length)}function et(e){return e<2147483647&&e>-2147483648?``+(e>=0?e|0:e-1|0):``+Math.floor(e)}function tt(e,t,n){if(e.charCodeAt(0)===40&&!t.match(Je)){var r=t.replace(/\( */,``).replace(/ \)/,``).replace(/\)/,``);return n>=0?tt(`n`,r,n):`(`+tt(`n`,r,-n)+`)`}if(t.charCodeAt(t.length-1)===44)return He(e,t,n);if(t.indexOf(`%`)!==-1)return Ve(e,t,n);if(t.indexOf(`E`)!==-1)return Ue(t,n);if(t.charCodeAt(0)===36)return`$`+tt(e,t.substr(t.charAt(1)==` `?2:1),n);var i,a,o,s,c=Math.abs(n),l=n<0?`-`:``;if(t.match(/^00+$/))return l+xe(c,t.length);if(t.match(/^[#?]+$/))return i=xe(n,0),i===`0`&&(i=``),i.length>t.length?i:Xe(t.substr(0,t.length-i.length))+i;if(a=t.match(We))return Ge(a,c,l);if(t.match(/^#+0+$/))return l+xe(c,t.length-t.indexOf(`0`));if(a=t.match(qe))return i=Ze(n,a[1].length).replace(/^([^\.]+)$/,`$1.`+Xe(a[1])).replace(/\.$/,`.`+Xe(a[1])).replace(/\.(\d*)$/,function(e,t){return`.`+t+Bt(`0`,Xe(a[1]).length-t.length)}),t.indexOf(`0.`)===-1?i.replace(/^0\./,`.`):i;if(t=t.replace(/^#+([0.])/,`$1`),a=t.match(/^(0*)\.(#*)$/))return l+Ze(c,a[2].length).replace(/\.(\d*[1-9])0*$/,`.$1`).replace(/^(-?\d*)$/,`$1.`).replace(/^0\./,a[1].length?`0.`:`.`);if(a=t.match(/^#{1,3},##0(\.?)$/))return l+ze(xe(c,0));if(a=t.match(/^#,##0\.([#0]*0)$/))return n<0?`-`+tt(e,t,-n):ze(``+(Math.floor(n)+$e(n,a[1].length)))+`.`+he(Qe(n,a[1].length),a[1].length);if(a=t.match(/^#,#*,#0/))return tt(e,t.replace(/^#,#*,/,``),n);if(a=t.match(/^([0#]+)(\\?-([0#]+))+$/))return i=me(tt(e,t.replace(/[\\-]/g,``),n)),o=0,me(me(t.replace(/\\/g,``)).replace(/[0#]/g,function(e){return o<i.length?i.charAt(o++):e===`0`?`0`:``}));if(t.match(Ye))return i=tt(e,`##########`,n),`(`+i.substr(0,3)+`) `+i.substr(3,3)+`-`+i.substr(6);var u=``;if(a=t.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/))return o=Math.min(a[4].length,7),s=Oe(c,10**o-1,!1),i=``+l,u=ot(`n`,a[1],s[1]),u.charAt(u.length-1)==` `&&(u=u.substr(0,u.length-1)+`0`),i+=u+a[2]+`/`+a[3],u=_e(s[2],o),u.length<a[4].length&&(u=Xe(a[4].substr(a[4].length-u.length))+u),i+=u,i;if(a=t.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/))return o=Math.min(Math.max(a[1].length,a[4].length),7),s=Oe(c,10**o-1,!0),l+(s[0]||(s[1]?``:`0`))+` `+(s[1]?ge(s[1],o)+a[2]+`/`+a[3]+_e(s[2],o):Bt(` `,2*o+1+a[2].length+a[3].length));if(a=t.match(/^[#0?]+$/))return i=xe(n,0),t.length<=i.length?i:Xe(t.substr(0,t.length-i.length))+i;if(a=t.match(/^([#0?]+)\.([#0]+)$/)){i=``+n.toFixed(Math.min(a[2].length,10)).replace(/([^0])0+$/,`$1`),o=i.indexOf(`.`);var d=t.indexOf(`.`)-o,f=t.length-i.length-d;return Xe(t.substr(0,d)+i+t.substr(t.length-f))}if(a=t.match(/^00,000\.([#0]*0)$/))return o=Qe(n,a[1].length),n<0?`-`+tt(e,t,-n):ze(et(n)).replace(/^\d,\d{3}$/,`0$&`).replace(/^\d*$/,function(e){return`00,`+(e.length<3?he(0,3-e.length):``)+e})+`.`+he(o,a[1].length);switch(t){case`###,##0.00`:return tt(e,`#,##0.00`,n);case`###,###`:case`##,###`:case`#,###`:var p=ze(xe(c,0));return p===`0`?``:l+p;case`###,###.00`:return tt(e,`###,##0.00`,n).replace(/^0\./,`.`);case`#,###.00`:return tt(e,`#,##0.00`,n).replace(/^0\./,`.`);default:}throw Error(`unsupported format |`+t+`|`)}function nt(e,t,n){for(var r=t.length-1;t.charCodeAt(r-1)===44;)--r;return ot(e,t.substr(0,r),n/10**(3*(t.length-r)))}function rt(e,t,n){var r=t.replace(Be,``),i=t.length-r.length;return ot(e,r,n*10**(2*i))+Bt(`%`,i)}function it(e,t){var n,r=e.indexOf(`E`)-e.indexOf(`.`)-1;if(e.match(/^#+0.0E\+0$/)){if(t==0)return`0.0E+0`;if(t<0)return`-`+it(e,-t);var i=e.indexOf(`.`);i===-1&&(i=e.indexOf(`E`));var a=Math.floor(Math.log(t)*Math.LOG10E)%i;if(a<0&&(a+=i),n=(t/10**a).toPrecision(r+1+(i+a)%i),!n.match(/[Ee]/)){var o=Math.floor(Math.log(t)*Math.LOG10E);n.indexOf(`.`)===-1?n=n.charAt(0)+`.`+n.substr(1)+`E+`+(o-n.length+a):n+=`E+`+(o-a),n=n.replace(/\+-/,`-`)}n=n.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/,function(e,t,n,r){return t+n+r.substr(0,(i+a)%i)+`.`+r.substr(a)+`E`})}else n=t.toExponential(r);return e.match(/E\+00$/)&&n.match(/e[+-]\d$/)&&(n=n.substr(0,n.length-1)+`0`+n.charAt(n.length-1)),e.match(/E\-/)&&n.match(/e\+/)&&(n=n.replace(/e\+/,`e`)),n.replace(`e`,`E`)}function at(e,t,n){if(e.charCodeAt(0)===40&&!t.match(Je)){var r=t.replace(/\( */,``).replace(/ \)/,``).replace(/\)/,``);return n>=0?at(`n`,r,n):`(`+at(`n`,r,-n)+`)`}if(t.charCodeAt(t.length-1)===44)return nt(e,t,n);if(t.indexOf(`%`)!==-1)return rt(e,t,n);if(t.indexOf(`E`)!==-1)return it(t,n);if(t.charCodeAt(0)===36)return`$`+at(e,t.substr(t.charAt(1)==` `?2:1),n);var i,a,o,s,c=Math.abs(n),l=n<0?`-`:``;if(t.match(/^00+$/))return l+he(c,t.length);if(t.match(/^[#?]+$/))return i=``+n,n===0&&(i=``),i.length>t.length?i:Xe(t.substr(0,t.length-i.length))+i;if(a=t.match(We))return Ke(a,c,l);if(t.match(/^#+0+$/))return l+he(c,t.length-t.indexOf(`0`));if(a=t.match(qe))return i=(``+n).replace(/^([^\.]+)$/,`$1.`+Xe(a[1])).replace(/\.$/,`.`+Xe(a[1])),i=i.replace(/\.(\d*)$/,function(e,t){return`.`+t+Bt(`0`,Xe(a[1]).length-t.length)}),t.indexOf(`0.`)===-1?i.replace(/^0\./,`.`):i;if(t=t.replace(/^#+([0.])/,`$1`),a=t.match(/^(0*)\.(#*)$/))return l+(``+c).replace(/\.(\d*[1-9])0*$/,`.$1`).replace(/^(-?\d*)$/,`$1.`).replace(/^0\./,a[1].length?`0.`:`.`);if(a=t.match(/^#{1,3},##0(\.?)$/))return l+ze(``+c);if(a=t.match(/^#,##0\.([#0]*0)$/))return n<0?`-`+at(e,t,-n):ze(``+n)+`.`+Bt(`0`,a[1].length);if(a=t.match(/^#,#*,#0/))return at(e,t.replace(/^#,#*,/,``),n);if(a=t.match(/^([0#]+)(\\?-([0#]+))+$/))return i=me(at(e,t.replace(/[\\-]/g,``),n)),o=0,me(me(t.replace(/\\/g,``)).replace(/[0#]/g,function(e){return o<i.length?i.charAt(o++):e===`0`?`0`:``}));if(t.match(Ye))return i=at(e,`##########`,n),`(`+i.substr(0,3)+`) `+i.substr(3,3)+`-`+i.substr(6);var u=``;if(a=t.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/))return o=Math.min(a[4].length,7),s=Oe(c,10**o-1,!1),i=``+l,u=ot(`n`,a[1],s[1]),u.charAt(u.length-1)==` `&&(u=u.substr(0,u.length-1)+`0`),i+=u+a[2]+`/`+a[3],u=_e(s[2],o),u.length<a[4].length&&(u=Xe(a[4].substr(a[4].length-u.length))+u),i+=u,i;if(a=t.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/))return o=Math.min(Math.max(a[1].length,a[4].length),7),s=Oe(c,10**o-1,!0),l+(s[0]||(s[1]?``:`0`))+` `+(s[1]?ge(s[1],o)+a[2]+`/`+a[3]+_e(s[2],o):Bt(` `,2*o+1+a[2].length+a[3].length));if(a=t.match(/^[#0?]+$/))return i=``+n,t.length<=i.length?i:Xe(t.substr(0,t.length-i.length))+i;if(a=t.match(/^([#0]+)\.([#0]+)$/)){i=``+n.toFixed(Math.min(a[2].length,10)).replace(/([^0])0+$/,`$1`),o=i.indexOf(`.`);var d=t.indexOf(`.`)-o,f=t.length-i.length-d;return Xe(t.substr(0,d)+i+t.substr(t.length-f))}if(a=t.match(/^00,000\.([#0]*0)$/))return n<0?`-`+at(e,t,-n):ze(``+n).replace(/^\d,\d{3}$/,`0$&`).replace(/^\d*$/,function(e){return`00,`+(e.length<3?he(0,3-e.length):``)+e})+`.`+he(0,a[1].length);switch(t){case`###,###`:case`##,###`:case`#,###`:var p=ze(``+c);return p===`0`?``:l+p;default:if(t.match(/\.[0#?]*$/))return at(e,t.slice(0,t.lastIndexOf(`.`)),n)+Xe(t.slice(t.lastIndexOf(`.`)))}throw Error(`unsupported format |`+t+`|`)}function ot(e,t,n){return(n|0)===n?at(e,t,n):tt(e,t,n)}function st(e){for(var t=[],n=!1,r=0,i=0;r<e.length;++r)switch(e.charCodeAt(r)){case 34:n=!n;break;case 95:case 42:case 92:++r;break;case 59:t[t.length]=e.substr(i,r-i),i=r+1}if(t[t.length]=e.substr(i),n===!0)throw Error(`Format |`+e+`| unterminated string `);return t}var ct=/\[[HhMmSs\u0E0A\u0E19\u0E17]*\]/;function lt(e){for(var t=0,n=``,r=``;t<e.length;)switch(n=e.charAt(t)){case`G`:Se(e,t)&&(t+=6),t++;break;case`"`:for(;e.charCodeAt(++t)!==34&&t<e.length;);++t;break;case`\\`:t+=2;break;case`_`:t+=2;break;case`@`:++t;break;case`B`:case`b`:if(e.charAt(t+1)===`1`||e.charAt(t+1)===`2`)return!0;case`M`:case`D`:case`Y`:case`H`:case`S`:case`E`:case`m`:case`d`:case`y`:case`h`:case`s`:case`e`:case`g`:return!0;case`A`:case`a`:case`上`:if(e.substr(t,3).toUpperCase()===`A/P`||e.substr(t,5).toUpperCase()===`AM/PM`||e.substr(t,5).toUpperCase()===`上午/下午`)return!0;++t;break;case`[`:for(r=n;e.charAt(t++)!==`]`&&t<e.length;)r+=e.charAt(t);if(r.match(ct))return!0;break;case`.`:case`0`:case`#`:for(;t<e.length&&(`0#?.,E+-%`.indexOf(n=e.charAt(++t))>-1||n==`\\`&&e.charAt(t+1)==`-`&&`0#`.indexOf(e.charAt(t+2))>-1););break;case`?`:for(;e.charAt(++t)===n;);break;case`*`:++t,(e.charAt(t)==` `||e.charAt(t)==`*`)&&++t;break;case`(`:case`)`:++t;break;case`1`:case`2`:case`3`:case`4`:case`5`:case`6`:case`7`:case`8`:case`9`:for(;t<e.length&&`0123456789`.indexOf(e.charAt(++t))>-1;);break;case` `:++t;break;default:++t;break}return!1}function ut(e,t,n,r){for(var i=[],a=``,o=0,s=``,c=`t`,l,u,d,f=`H`;o<e.length;)switch(s=e.charAt(o)){case`G`:if(!Se(e,o))throw Error(`unrecognized character `+s+` in `+e);i[i.length]={t:`G`,v:`General`},o+=7;break;case`"`:for(a=``;(d=e.charCodeAt(++o))!==34&&o<e.length;)a+=String.fromCharCode(d);i[i.length]={t:`t`,v:a},++o;break;case`\\`:var p=e.charAt(++o),m=p===`(`||p===`)`?p:`t`;i[i.length]={t:m,v:p},++o;break;case`_`:i[i.length]={t:`t`,v:` `},o+=2;break;case`@`:i[i.length]={t:`T`,v:t},++o;break;case`B`:case`b`:if(e.charAt(o+1)===`1`||e.charAt(o+1)===`2`){if(l==null&&(l=Ae(t,n,e.charAt(o+1)===`2`),l==null))return``;i[i.length]={t:`X`,v:e.substr(o,2)},c=s,o+=2;break}case`M`:case`D`:case`Y`:case`H`:case`S`:case`E`:s=s.toLowerCase();case`m`:case`d`:case`y`:case`h`:case`s`:case`e`:case`g`:if(t<0||l==null&&(l=Ae(t,n),l==null))return``;for(a=s;++o<e.length&&e.charAt(o).toLowerCase()===s;)a+=s;s===`m`&&c.toLowerCase()===`h`&&(s=`M`),s===`h`&&(s=f),i[i.length]={t:s,v:a},c=s;break;case`A`:case`a`:case`上`:var h={t:s,v:s};if(l??=Ae(t,n),e.substr(o,3).toUpperCase()===`A/P`?(l!=null&&(h.v=l.H>=12?e.charAt(o+2):s),h.t=`T`,f=`h`,o+=3):e.substr(o,5).toUpperCase()===`AM/PM`?(l!=null&&(h.v=l.H>=12?`PM`:`AM`),h.t=`T`,o+=5,f=`h`):e.substr(o,5).toUpperCase()===`上午/下午`?(l!=null&&(h.v=l.H>=12?`下午`:`上午`),h.t=`T`,o+=5,f=`h`):(h.t=`t`,++o),l==null&&h.t===`T`)return``;i[i.length]=h,c=s;break;case`[`:for(a=s;e.charAt(o++)!==`]`&&o<e.length;)a+=e.charAt(o);if(a.slice(-1)!==`]`)throw`unterminated "[" block: |`+a+`|`;if(a.match(ct)){if(l==null&&(l=Ae(t,n),l==null))return``;i[i.length]={t:`Z`,v:a.toLowerCase()},c=a.charAt(1)}else a.indexOf(`$`)>-1&&(a=(a.match(/\$([^-\[\]]*)/)||[])[1]||`$`,lt(e)||(i[i.length]={t:`t`,v:a}));break;case`.`:if(l!=null){for(a=s;++o<e.length&&(s=e.charAt(o))===`0`;)a+=s;i[i.length]={t:`s`,v:a};break}case`0`:case`#`:for(a=s;++o<e.length&&`0#?.,E+-%`.indexOf(s=e.charAt(o))>-1;)a+=s;i[i.length]={t:`n`,v:a};break;case`?`:for(a=s;e.charAt(++o)===s;)a+=s;i[i.length]={t:s,v:a},c=s;break;case`*`:++o,(e.charAt(o)==` `||e.charAt(o)==`*`)&&++o;break;case`(`:case`)`:i[i.length]={t:r===1?`t`:s,v:s},++o;break;case`1`:case`2`:case`3`:case`4`:case`5`:case`6`:case`7`:case`8`:case`9`:for(a=s;o<e.length&&`0123456789`.indexOf(e.charAt(++o))>-1;)a+=e.charAt(o);i[i.length]={t:`D`,v:a};break;case` `:i[i.length]={t:s,v:s},++o;break;case`$`:i[i.length]={t:`t`,v:`$`},++o;break;default:if(`,$-+/():!^&'~{}<>=€acfijklopqrtuvwxzP`.indexOf(s)===-1)throw Error(`unrecognized character `+s+` in `+e);i[i.length]={t:`t`,v:s},++o;break}var g=0,_=0,v;for(o=i.length-1,c=`t`;o>=0;--o)switch(i[o].t){case`h`:case`H`:i[o].t=f,c=`h`,g<1&&(g=1);break;case`s`:(v=i[o].v.match(/\.0+$/))&&(_=Math.max(_,v[0].length-1),g=4),g<3&&(g=3);case`d`:case`y`:case`e`:c=i[o].t;break;case`M`:c=i[o].t,g<2&&(g=2);break;case`m`:c===`s`&&(i[o].t=`M`,g<2&&(g=2));break;case`X`:break;case`Z`:g<1&&i[o].v.match(/[Hh]/)&&(g=1),g<2&&i[o].v.match(/[Mm]/)&&(g=2),g<3&&i[o].v.match(/[Ss]/)&&(g=3)}var y;switch(g){case 0:break;case 1:case 2:case 3:l.u>=.5&&(l.u=0,++l.S),l.S>=60&&(l.S=0,++l.M),l.M>=60&&(l.M=0,++l.H),l.H>=24&&(l.H=0,++l.D,y=Ae(l.D),y.u=l.u,y.S=l.S,y.M=l.M,y.H=l.H,l=y);break;case 4:switch(_){case 1:l.u=Math.round(l.u*10)/10;break;case 2:l.u=Math.round(l.u*100)/100;break;case 3:l.u=Math.round(l.u*1e3)/1e3;break}l.u>=1&&(l.u=0,++l.S),l.S>=60&&(l.S=0,++l.M),l.M>=60&&(l.M=0,++l.H),l.H>=24&&(l.H=0,++l.D,y=Ae(l.D),y.u=l.u,y.S=l.S,y.M=l.M,y.H=l.H,l=y);break}var b=``,x;for(o=0;o<i.length;++o)switch(i[o].t){case`t`:case`T`:case` `:case`D`:break;case`X`:i[o].v=``,i[o].t=`;`;break;case`d`:case`m`:case`y`:case`h`:case`H`:case`M`:case`s`:case`e`:case`b`:case`Z`:i[o].v=Re(i[o].t.charCodeAt(0),i[o].v,l,_),i[o].t=`t`;break;case`n`:case`?`:for(x=o+1;i[x]!=null&&((s=i[x].t)===`?`||s===`D`||(s===` `||s===`t`)&&i[x+1]!=null&&(i[x+1].t===`?`||i[x+1].t===`t`&&i[x+1].v===`/`)||i[o].t===`(`&&(s===` `||s===`n`||s===`)`)||s===`t`&&(i[x].v===`/`||i[x].v===` `&&i[x+1]!=null&&i[x+1].t==`?`));)i[o].v+=i[x].v,i[x]={v:``,t:`;`},++x;b+=i[o].v,o=x-1;break;case`G`:i[o].t=`t`,i[o].v=Ie(t,n);break}var S=``,C,w;if(b.length>0){b.charCodeAt(0)==40?(C=t<0&&b.charCodeAt(0)===45?-t:t,w=ot(`n`,b,C)):(C=t<0&&r>1?-t:t,w=ot(`n`,b,C),C<0&&i[0]&&i[0].t==`t`&&(w=w.substr(1),i[0].v=`-`+i[0].v)),x=w.length-1;var T=i.length;for(o=0;o<i.length;++o)if(i[o]!=null&&i[o].t!=`t`&&i[o].v.indexOf(`.`)>-1){T=o;break}var E=i.length;if(T===i.length&&w.indexOf(`E`)===-1){for(o=i.length-1;o>=0;--o)i[o]==null||`n?`.indexOf(i[o].t)===-1||(x>=i[o].v.length-1?(x-=i[o].v.length,i[o].v=w.substr(x+1,i[o].v.length)):x<0?i[o].v=``:(i[o].v=w.substr(0,x+1),x=-1),i[o].t=`t`,E=o);x>=0&&E<i.length&&(i[E].v=w.substr(0,x+1)+i[E].v)}else if(T!==i.length&&w.indexOf(`E`)===-1){for(x=w.indexOf(`.`)-1,o=T;o>=0;--o)if(!(i[o]==null||`n?`.indexOf(i[o].t)===-1)){for(u=i[o].v.indexOf(`.`)>-1&&o===T?i[o].v.indexOf(`.`)-1:i[o].v.length-1,S=i[o].v.substr(u+1);u>=0;--u)x>=0&&(i[o].v.charAt(u)===`0`||i[o].v.charAt(u)===`#`)&&(S=w.charAt(x--)+S);i[o].v=S,i[o].t=`t`,E=o}for(x>=0&&E<i.length&&(i[E].v=w.substr(0,x+1)+i[E].v),x=w.indexOf(`.`)+1,o=T;o<i.length;++o)if(!(i[o]==null||`n?(`.indexOf(i[o].t)===-1&&o!==T)){for(u=i[o].v.indexOf(`.`)>-1&&o===T?i[o].v.indexOf(`.`)+1:0,S=i[o].v.substr(0,u);u<i[o].v.length;++u)x<w.length&&(S+=w.charAt(x++));i[o].v=S,i[o].t=`t`,E=o}}}for(o=0;o<i.length;++o)i[o]!=null&&`n?`.indexOf(i[o].t)>-1&&(C=r>1&&t<0&&o>0&&i[o-1].v===`-`?-t:t,i[o].v=ot(i[o].t,i[o].v,C),i[o].t=`t`);var D=``;for(o=0;o!==i.length;++o)i[o]!=null&&(D+=i[o].v);return D}var dt=/\[(=|>[=]?|<[>=]?)(-?\d+(?:\.\d*)?)\]/;function ft(e,t){if(t==null)return!1;var n=parseFloat(t[2]);switch(t[1]){case`=`:if(e==n)return!0;break;case`>`:if(e>n)return!0;break;case`<`:if(e<n)return!0;break;case`<>`:if(e!=n)return!0;break;case`>=`:if(e>=n)return!0;break;case`<=`:if(e<=n)return!0;break}return!1}function pt(e,t){var n=st(e),r=n.length,i=n[r-1].indexOf(`@`);if(r<4&&i>-1&&--r,n.length>4)throw Error(`cannot find right format for |`+n.join(`|`)+`|`);if(typeof t!=`number`)return[4,n.length===4||i>-1?n[n.length-1]:`@`];switch(typeof t==`number`&&!isFinite(t)&&(t=0),n.length){case 1:n=i>-1?[`General`,`General`,`General`,n[0]]:[n[0],n[0],n[0],`@`];break;case 2:n=i>-1?[n[0],n[0],n[0],n[1]]:[n[0],n[1],n[0],`@`];break;case 3:n=i>-1?[n[0],n[1],n[0],n[2]]:[n[0],n[1],n[2],`@`];break;case 4:break}var a=t>0?n[0]:t<0?n[1]:n[2];if(n[0].indexOf(`[`)===-1&&n[1].indexOf(`[`)===-1)return[r,a];if(n[0].match(/\[[=<>]/)!=null||n[1].match(/\[[=<>]/)!=null){var o=n[0].match(dt),s=n[1].match(dt);return ft(t,o)?[r,n[0]]:ft(t,s)?[r,n[1]]:[r,n[o!=null&&s!=null?2:1]]}return[r,a]}function mt(e,t,n){n??={};var r=``;switch(typeof e){case`string`:r=e==`m/d/yy`&&n.dateNF?n.dateNF:e;break;case`number`:r=e==14&&n.dateNF?n.dateNF:(n.table==null?G:n.table)[e],r??=n.table&&n.table[Ee[e]]||G[Ee[e]],r??=De[e]||`General`;break}if(Se(r,0))return Ie(t,n);t instanceof Date&&(t=jt(t,n.date1904));var i=pt(r,t);if(Se(i[1]))return Ie(t,n);if(t===!0)t=`TRUE`;else if(t===!1)t=`FALSE`;else if(t===``||t==null)return``;else if(isNaN(t)&&i[1].indexOf(`0`)>-1)return`#NUM!`;else if(!isFinite(t)&&i[1].indexOf(`0`)>-1)return`#DIV/0!`;return ut(i[1],t,n,i[0])}function ht(e,t){if(typeof t!=`number`){t=+t||-1;for(var n=0;n<392;++n){if(G[n]==null){t<0&&(t=n);continue}if(G[n]==e){t=n;break}}t<0&&(t=391)}return G[t]=e,t}function gt(){G=Te()}var _t={5:`"$"#,##0_);\\("$"#,##0\\)`,6:`"$"#,##0_);[Red]\\("$"#,##0\\)`,7:`"$"#,##0.00_);\\("$"#,##0.00\\)`,8:`"$"#,##0.00_);[Red]\\("$"#,##0.00\\)`,23:`General`,24:`General`,25:`General`,26:`General`,27:`m/d/yy`,28:`m/d/yy`,29:`m/d/yy`,30:`m/d/yy`,31:`m/d/yy`,32:`h:mm:ss`,33:`h:mm:ss`,34:`h:mm:ss`,35:`h:mm:ss`,36:`m/d/yy`,41:`_(* #,##0_);_(* (#,##0);_(* "-"_);_(@_)`,42:`_("$"* #,##0_);_("$"* (#,##0);_("$"* "-"_);_(@_)`,43:`_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)`,44:`_("$"* #,##0.00_);_("$"* (#,##0.00);_("$"* "-"??_);_(@_)`,50:`m/d/yy`,51:`m/d/yy`,52:`m/d/yy`,53:`m/d/yy`,54:`m/d/yy`,55:`m/d/yy`,56:`m/d/yy`,57:`m/d/yy`,58:`m/d/yy`,59:`0`,60:`0.00`,61:`#,##0`,62:`#,##0.00`,63:`"$"#,##0_);\\("$"#,##0\\)`,64:`"$"#,##0_);[Red]\\("$"#,##0\\)`,65:`"$"#,##0.00_);\\("$"#,##0.00\\)`,66:`"$"#,##0.00_);[Red]\\("$"#,##0.00\\)`,67:`0%`,68:`0.00%`,69:`# ?/?`,70:`# ??/??`,71:`m/d/yy`,72:`m/d/yy`,73:`d-mmm-yy`,74:`d-mmm`,75:`mmm-yy`,76:`h:mm`,77:`h:mm:ss`,78:`m/d/yy h:mm`,79:`mm:ss`,80:`[h]:mm:ss`,81:`mmss.0`},vt=/[dD]+|[mM]+|[yYeE]+|[Hh]+|[Ss]+/g;function yt(e){var t=typeof e==`number`?G[e]:e;return t=t.replace(vt,`(\\d+)`),vt.lastIndex=0,RegExp(`^`+t+`$`)}function bt(e,t,n){var r=-1,i=-1,a=-1,o=-1,s=-1,c=-1;(t.match(vt)||[]).forEach(function(e,t){var l=parseInt(n[t+1],10);switch(e.toLowerCase().charAt(0)){case`y`:r=l;break;case`d`:a=l;break;case`h`:o=l;break;case`s`:c=l;break;case`m`:o>=0?s=l:i=l;break}}),vt.lastIndex=0,c>=0&&s==-1&&i>=0&&(s=i,i=-1);var l=(``+(r>=0?r:new Date().getFullYear())).slice(-4)+`-`+(`00`+(i>=1?i:1)).slice(-2)+`-`+(`00`+(a>=1?a:1)).slice(-2);l.length==7&&(l=`0`+l),l.length==8&&(l=`20`+l);var u=(`00`+(o>=0?o:0)).slice(-2)+`:`+(`00`+(s>=0?s:0)).slice(-2)+`:`+(`00`+(c>=0?c:0)).slice(-2);return o==-1&&s==-1&&c==-1?l:r==-1&&i==-1&&a==-1?u:l+`T`+u}var xt={"d.m":`d\\.m`};function St(e,t){return ht(xt[e]||e,t)}var Ct=(function(){var e={};e.version=`1.2.0`;function t(){for(var e=0,t=Array(256),n=0;n!=256;++n)e=n,e=e&1?-306674912^e>>>1:e>>>1,e=e&1?-306674912^e>>>1:e>>>1,e=e&1?-306674912^e>>>1:e>>>1,e=e&1?-306674912^e>>>1:e>>>1,e=e&1?-306674912^e>>>1:e>>>1,e=e&1?-306674912^e>>>1:e>>>1,e=e&1?-306674912^e>>>1:e>>>1,e=e&1?-306674912^e>>>1:e>>>1,t[n]=e;return typeof Int32Array<`u`?new Int32Array(t):t}var n=t();function r(e){var t=0,n=0,r=0,i=typeof Int32Array<`u`?new Int32Array(4096):Array(4096);for(r=0;r!=256;++r)i[r]=e[r];for(r=0;r!=256;++r)for(n=e[r],t=256+r;t<4096;t+=256)n=i[t]=n>>>8^e[n&255];var a=[];for(r=1;r!=16;++r)a[r-1]=typeof Int32Array<`u`&&typeof i.subarray==`function`?i.subarray(r*256,r*256+256):i.slice(r*256,r*256+256);return a}var i=r(n),a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14];function b(e,t){for(var r=t^-1,i=0,a=e.length;i<a;)r=r>>>8^n[(r^e.charCodeAt(i++))&255];return~r}function x(e,t){for(var r=t^-1,i=e.length-15,b=0;b<i;)r=y[e[b++]^r&255]^v[e[b++]^r>>8&255]^_[e[b++]^r>>16&255]^g[e[b++]^r>>>24]^h[e[b++]]^m[e[b++]]^p[e[b++]]^f[e[b++]]^d[e[b++]]^u[e[b++]]^l[e[b++]]^c[e[b++]]^s[e[b++]]^o[e[b++]]^a[e[b++]]^n[e[b++]];for(i+=15;b<i;)r=r>>>8^n[(r^e[b++])&255];return~r}function S(e,t){for(var r=t^-1,i=0,a=e.length,o=0,s=0;i<a;)o=e.charCodeAt(i++),o<128?r=r>>>8^n[(r^o)&255]:o<2048?(r=r>>>8^n[(r^(192|o>>6&31))&255],r=r>>>8^n[(r^(128|o&63))&255]):o>=55296&&o<57344?(o=(o&1023)+64,s=e.charCodeAt(i++)&1023,r=r>>>8^n[(r^(240|o>>8&7))&255],r=r>>>8^n[(r^(128|o>>2&63))&255],r=r>>>8^n[(r^(128|s>>6&15|(o&3)<<4))&255],r=r>>>8^n[(r^(128|s&63))&255]):(r=r>>>8^n[(r^(224|o>>12&15))&255],r=r>>>8^n[(r^(128|o>>6&63))&255],r=r>>>8^n[(r^(128|o&63))&255]);return~r}return e.table=n,e.bstr=b,e.buf=x,e.str=S,e})(),K=(function(){var e={};e.version=`1.2.2`;function t(e,t){for(var n=e.split(`/`),r=t.split(`/`),i=0,a=0,o=Math.min(n.length,r.length);i<o;++i){if(a=n[i].length-r[i].length)return a;if(n[i]!=r[i])return n[i]<r[i]?-1:1}return n.length-r.length}function n(e){if(e.charAt(e.length-1)==`/`)return e.slice(0,-1).indexOf(`/`)===-1?e:n(e.slice(0,-1));var t=e.lastIndexOf(`/`);return t===-1?e:e.slice(0,t+1)}function r(e){if(e.charAt(e.length-1)==`/`)return r(e.slice(0,-1));var t=e.lastIndexOf(`/`);return t===-1?e:e.slice(t+1)}function i(e,t){typeof t==`string`&&(t=new Date(t));var n=t.getHours();n=n<<6|t.getMinutes(),n=n<<5|t.getSeconds()>>>1,e.write_shift(2,n);var r=t.getFullYear()-1980;r=r<<4|t.getMonth()+1,r=r<<5|t.getDate(),e.write_shift(2,r)}function a(e){var t=e.read_shift(2)&65535,n=e.read_shift(2)&65535,r=new Date,i=n&31;n>>>=5;var a=n&15;n>>>=4,r.setMilliseconds(0),r.setFullYear(n+1980),r.setMonth(a-1),r.setDate(i);var o=t&31;t>>>=5;var s=t&63;return t>>>=6,r.setHours(t),r.setMinutes(s),r.setSeconds(o<<1),r}function o(e){Ir(e,0);for(var t={},n=0;e.l<=e.length-4;){var r=e.read_shift(2),i=e.read_shift(2),a=e.l+i,o={};switch(r){case 21589:n=e.read_shift(1),n&1&&(o.mtime=e.read_shift(4)),i>5&&(n&2&&(o.atime=e.read_shift(4)),n&4&&(o.ctime=e.read_shift(4))),o.mtime&&(o.mt=new Date(o.mtime*1e3));break;case 1:var s=e.read_shift(4),c=e.read_shift(4);o.usz=c*2**32+s,s=e.read_shift(4),c=e.read_shift(4),o.csz=c*2**32+s;break}e.l=a,t[r]=o}return t}var s;function c(){return s||=wt}function l(e,t){if(e[0]==80&&e[1]==75)return ze(e,t);if((e[0]|32)==109&&(e[1]|32)==105)return Je(e,t);if(e.length<512)throw Error(`CFB file size `+e.length+` < 512`);var n=3,r=512,i=0,a=0,o=0,s=0,c=0,l=[],m=e.slice(0,512);Ir(m,0);var g=u(m);switch(n=g[0],n){case 3:r=512;break;case 4:r=4096;break;case 0:if(g[1]==0)return ze(e,t);default:throw Error(`Major Version: Expected 3 or 4 saw `+n)}r!==512&&(m=e.slice(0,r),Ir(m,28));var y=e.slice(0,r);d(m,n);var b=m.read_shift(4,`i`);if(n===3&&b!==0)throw Error(`# Directory Sectors: Expected 0 saw `+b);m.l+=4,o=m.read_shift(4,`i`),m.l+=4,m.chk(`00100000`,`Mini Stream Cutoff Size: `),s=m.read_shift(4,`i`),i=m.read_shift(4,`i`),c=m.read_shift(4,`i`),a=m.read_shift(4,`i`);for(var x=-1,S=0;S<109&&(x=m.read_shift(4,`i`),!(x<0));++S)l[S]=x;var C=f(e,r);h(c,a,C,r,l);var w=_(C,o,l,r);o<w.length&&(w[o].name=`!Directory`),i>0&&s!==O&&(w[s].name=`!MiniFAT`),w[l[0]].name=`!FAT`,w.fat_addrs=l,w.ssz=r;var T={},E=[],D=[],k=[];v(o,w,C,E,i,T,D,s),p(D,k,E),E.shift();var A={FileIndex:D,FullPaths:k};return t&&t.raw&&(A.raw={header:y,sectors:C}),A}function u(e){if(e[e.l]==80&&e[e.l+1]==75)return[0,0];e.chk(k,`Header Signature: `),e.l+=16;var t=e.read_shift(2,`u`);return[e.read_shift(2,`u`),t]}function d(e,t){var n=9;switch(e.l+=2,n=e.read_shift(2)){case 9:if(t!=3)throw Error(`Sector Shift: Expected 9 saw `+n);break;case 12:if(t!=4)throw Error(`Sector Shift: Expected 12 saw `+n);break;default:throw Error(`Sector Shift: Expected 9 or 12 saw `+n)}e.chk(`0600`,`Mini Sector Shift: `),e.chk(`000000000000`,`Reserved: `)}function f(e,t){for(var n=Math.ceil(e.length/t)-1,r=[],i=1;i<n;++i)r[i-1]=e.slice(i*t,(i+1)*t);return r[n-1]=e.slice(n*t),r}function p(e,t,n){for(var r=0,i=0,a=0,o=0,s=0,c=n.length,l=[],u=[];r<c;++r)l[r]=u[r]=r,t[r]=n[r];for(;s<u.length;++s)r=u[s],i=e[r].L,a=e[r].R,o=e[r].C,l[r]===r&&(i!==-1&&l[i]!==i&&(l[r]=l[i]),a!==-1&&l[a]!==a&&(l[r]=l[a])),o!==-1&&(l[o]=r),i!==-1&&r!=l[r]&&(l[i]=l[r],u.lastIndexOf(i)<s&&u.push(i)),a!==-1&&r!=l[r]&&(l[a]=l[r],u.lastIndexOf(a)<s&&u.push(a));for(r=1;r<c;++r)l[r]===r&&(a!==-1&&l[a]!==a?l[r]=l[a]:i!==-1&&l[i]!==i&&(l[r]=l[i]));for(r=1;r<c;++r)if(e[r].type!==0){if(s=r,s!=l[s])do s=l[s],t[r]=t[s]+`/`+t[r];while(s!==0&&l[s]!==-1&&s!=l[s]);l[r]=-1}for(t[0]+=`/`,r=1;r<c;++r)e[r].type!==2&&(t[r]+=`/`)}function m(e,t,n){for(var r=e.start,i=e.size,a=[],o=r;n&&i>0&&o>=0;)a.push(t.slice(o*D,o*D+D)),i-=D,o=Or(n,o*4);return a.length===0?Rr(0):ue(a).slice(0,e.size)}function h(e,t,n,r,i){var a=O;if(e===O){if(t!==0)throw Error(`DIFAT chain shorter than expected`)}else if(e!==-1){var o=n[e],s=(r>>>2)-1;if(!o)return;for(var c=0;c<s&&(a=Or(o,c*4))!==O;++c)i.push(a);t>=1&&h(Or(o,r-4),t-1,n,r,i)}}function g(e,t,n,r,i){var a=[],o=[];i||=[];var s=r-1,c=0,l=0;for(c=t;c>=0;){i[c]=!0,a[a.length]=c,o.push(e[c]);var u=n[Math.floor(c*4/r)];if(l=c*4&s,r<4+l)throw Error(`FAT boundary crossed: `+c+` 4 `+r);if(!e[u])break;c=Or(e[u],l)}return{nodes:a,data:rr([o])}}function _(e,t,n,r){var i=e.length,a=[],o=[],s=[],c=[],l=r-1,u=0,d=0,f=0,p=0;for(u=0;u<i;++u)if(s=[],f=u+t,f>=i&&(f-=i),!o[f]){c=[];var m=[];for(d=f;d>=0;){m[d]=!0,o[d]=!0,s[s.length]=d,c.push(e[d]);var h=n[Math.floor(d*4/r)];if(p=d*4&l,r<4+p)throw Error(`FAT boundary crossed: `+d+` 4 `+r);if(!e[h]||(d=Or(e[h],p),m[d]))break}a[f]={nodes:s,data:rr([c])}}return a}function v(e,t,n,r,i,a,o,s){for(var c=0,l=r.length?2:0,u=t[e].data,d=0,f=0,p;d<u.length;d+=128){var h=u.slice(d,d+128);Ir(h,64),f=h.read_shift(2),p=ar(h,0,f-l),r.push(p);var _={name:p,type:h.read_shift(1),color:h.read_shift(1),L:h.read_shift(4,`i`),R:h.read_shift(4,`i`),C:h.read_shift(4,`i`),clsid:h.read_shift(16),state:h.read_shift(4,`i`),start:0,size:0};h.read_shift(2)+h.read_shift(2)+h.read_shift(2)+h.read_shift(2)!==0&&(_.ct=y(h,h.l-8)),h.read_shift(2)+h.read_shift(2)+h.read_shift(2)+h.read_shift(2)!==0&&(_.mt=y(h,h.l-8)),_.start=h.read_shift(4,`i`),_.size=h.read_shift(4,`i`),_.size<0&&_.start<0&&(_.size=_.type=0,_.start=O,_.name=``),_.type===5?(c=_.start,i>0&&c!==O&&(t[c].name=`!StreamData`)):_.size>=4096?(_.storage=`fat`,t[_.start]===void 0&&(t[_.start]=g(n,_.start,t.fat_addrs,t.ssz)),t[_.start].name=_.name,_.content=t[_.start].data.slice(0,_.size)):(_.storage=`minifat`,_.size<0?_.size=0:c!==O&&_.start!==O&&t[c]&&(_.content=m(_,t[c].data,(t[s]||{}).data))),_.content&&Ir(_.content,0),a[p]=_,o.push(_)}}function y(e,t){return new Date((Dr(e,t+4)/1e7*2**32+Dr(e,t)/1e7-11644473600)*1e3)}function b(e,t){return c(),l(s.readFileSync(e),t)}function x(e,t){var n=t&&t.type;switch(n||U&&Buffer.isBuffer(e)&&(n=`buffer`),n||`base64`){case`file`:return b(e,t);case`base64`:return l(se(H(e)),t);case`binary`:return l(se(e),t)}return l(e,t)}function S(e,t){var n=t||{},r=n.root||`Root Entry`;if(e.FullPaths||=[],e.FileIndex||=[],e.FullPaths.length!==e.FileIndex.length)throw Error(`inconsistent CFB structure`);e.FullPaths.length===0&&(e.FullPaths[0]=r+`/`,e.FileIndex[0]={name:r,type:5}),n.CLSID&&(e.FileIndex[0].clsid=n.CLSID),C(e)}function C(e){var t=`Sh33tJ5`;if(!K.find(e,`/`+t)){var n=Rr(4);n[0]=55,n[1]=n[3]=50,n[2]=54,e.FileIndex.push({name:t,type:2,content:n,size:4,L:69,R:69,C:69}),e.FullPaths.push(e.FullPaths[0]+t),w(e)}}function w(e,i){S(e);for(var a=!1,o=!1,s=e.FullPaths.length-1;s>=0;--s){var c=e.FileIndex[s];switch(c.type){case 0:o?a=!0:(e.FileIndex.pop(),e.FullPaths.pop());break;case 1:case 2:case 5:o=!0,isNaN(c.R*c.L*c.C)&&(a=!0),c.R>-1&&c.L>-1&&c.R==c.L&&(a=!0);break;default:a=!0;break}}if(!(!a&&!i)){var l=new Date(1987,1,19),u=0,d=Object.create?Object.create(null):{},f=[];for(s=0;s<e.FullPaths.length;++s)d[e.FullPaths[s]]=!0,e.FileIndex[s].type!==0&&f.push([e.FullPaths[s],e.FileIndex[s]]);for(s=0;s<f.length;++s){var p=n(f[s][0]);for(o=d[p];!o;){for(;n(p)&&!d[n(p)];)p=n(p);f.push([p,{name:r(p).replace(`/`,``),type:1,clsid:j,ct:l,mt:l,content:null}]),d[p]=!0,p=n(f[s][0]),o=d[p]}}for(f.sort(function(e,n){return t(e[0],n[0])}),e.FullPaths=[],e.FileIndex=[],s=0;s<f.length;++s)e.FullPaths[s]=f[s][0],e.FileIndex[s]=f[s][1];for(s=0;s<f.length;++s){var m=e.FileIndex[s],h=e.FullPaths[s];if(m.name=r(h).replace(`/`,``),m.L=m.R=m.C=-(m.color=1),m.size=m.content?m.content.length:0,m.start=0,m.clsid=m.clsid||j,s===0)m.C=f.length>1?1:-1,m.size=0,m.type=5;else if(h.slice(-1)==`/`){for(u=s+1;u<f.length&&n(e.FullPaths[u])!=h;++u);for(m.C=u>=f.length?-1:u,u=s+1;u<f.length&&n(e.FullPaths[u])!=n(h);++u);m.R=u>=f.length?-1:u,m.type=1}else n(e.FullPaths[s+1]||``)==n(h)&&(m.R=s+1),m.type=2}}}function T(e,t){var n=t||{};if(n.fileType==`mad`)return Ye(e,n);switch(w(e),n.fileType){case`zip`:return Ve(e,n)}var r=(function(e){for(var t=0,n=0,r=0;r<e.FileIndex.length;++r){var i=e.FileIndex[r];if(i.content){var a=i.content.length;a>0&&(a<4096?t+=a+63>>6:n+=a+511>>9)}}for(var o=e.FullPaths.length+3>>2,s=t+7>>3,c=t+127>>7,l=s+n+o+c,u=l+127>>7,d=u<=109?0:Math.ceil((u-109)/127);l+u+d+127>>7>u;)d=++u<=109?0:Math.ceil((u-109)/127);var f=[1,d,u,c,o,n,t,0];return e.FileIndex[0].size=t<<6,f[7]=(e.FileIndex[0].start=f[0]+f[1]+f[2]+f[3]+f[4]+f[5])+(f[6]+7>>3),f})(e),i=Rr(r[7]<<9),a=0,o=0;for(a=0;a<8;++a)i.write_shift(1,A[a]);for(a=0;a<8;++a)i.write_shift(2,0);for(i.write_shift(2,62),i.write_shift(2,3),i.write_shift(2,65534),i.write_shift(2,9),i.write_shift(2,6),a=0;a<3;++a)i.write_shift(2,0);for(i.write_shift(4,0),i.write_shift(4,r[2]),i.write_shift(4,r[0]+r[1]+r[2]+r[3]-1),i.write_shift(4,0),i.write_shift(4,4096),i.write_shift(4,r[3]?r[0]+r[1]+r[2]-1:O),i.write_shift(4,r[3]),i.write_shift(-4,r[1]?r[0]-1:O),i.write_shift(4,r[1]),a=0;a<109;++a)i.write_shift(-4,a<r[2]?r[1]+a:-1);if(r[1])for(o=0;o<r[1];++o){for(;a<236+o*127;++a)i.write_shift(-4,a<r[2]?r[1]+a:-1);i.write_shift(-4,o===r[1]-1?O:o+1)}var s=function(e){for(o+=e;a<o-1;++a)i.write_shift(-4,a+1);e&&(++a,i.write_shift(-4,O))};for(o=a=0,o+=r[1];a<o;++a)i.write_shift(-4,M.DIFSECT);for(o+=r[2];a<o;++a)i.write_shift(-4,M.FATSECT);s(r[3]),s(r[4]);for(var c=0,l=0,u=e.FileIndex[0];c<e.FileIndex.length;++c)u=e.FileIndex[c],u.content&&(l=u.content.length,!(l<4096)&&(u.start=o,s(l+511>>9)));for(s(r[6]+7>>3);i.l&511;)i.write_shift(-4,M.ENDOFCHAIN);for(o=a=0,c=0;c<e.FileIndex.length;++c)u=e.FileIndex[c],u.content&&(l=u.content.length,!(!l||l>=4096)&&(u.start=o,s(l+63>>6)));for(;i.l&511;)i.write_shift(-4,M.ENDOFCHAIN);for(a=0;a<r[4]<<2;++a){var d=e.FullPaths[a];if(!d||d.length===0){for(c=0;c<17;++c)i.write_shift(4,0);for(c=0;c<3;++c)i.write_shift(4,-1);for(c=0;c<12;++c)i.write_shift(4,0);continue}u=e.FileIndex[a],a===0&&(u.start=u.size?u.start-1:O);var f=a===0&&n.root||u.name;if(f.length>31&&(console.error(`Name `+f+` will be truncated to `+f.slice(0,31)),f=f.slice(0,31)),l=2*(f.length+1),i.write_shift(64,f,`utf16le`),i.write_shift(2,l),i.write_shift(1,u.type),i.write_shift(1,u.color),i.write_shift(-4,u.L),i.write_shift(-4,u.R),i.write_shift(-4,u.C),u.clsid)i.write_shift(16,u.clsid,`hex`);else for(c=0;c<4;++c)i.write_shift(4,0);i.write_shift(4,u.state||0),i.write_shift(4,0),i.write_shift(4,0),i.write_shift(4,0),i.write_shift(4,0),i.write_shift(4,u.start),i.write_shift(4,u.size),i.write_shift(4,0)}for(a=1;a<e.FileIndex.length;++a)if(u=e.FileIndex[a],u.size>=4096)if(i.l=u.start+1<<9,U&&Buffer.isBuffer(u.content))u.content.copy(i,i.l,0,u.size),i.l+=u.size+511&-512;else{for(c=0;c<u.size;++c)i.write_shift(1,u.content[c]);for(;c&511;++c)i.write_shift(1,0)}for(a=1;a<e.FileIndex.length;++a)if(u=e.FileIndex[a],u.size>0&&u.size<4096)if(U&&Buffer.isBuffer(u.content))u.content.copy(i,i.l,0,u.size),i.l+=u.size+63&-64;else{for(c=0;c<u.size;++c)i.write_shift(1,u.content[c]);for(;c&63;++c)i.write_shift(1,0)}if(U)i.l=i.length;else for(;i.l<i.length;)i.write_shift(1,0);return i}function E(e,t){var n=e.FullPaths.map(function(e){return e.toUpperCase()}),r=n.map(function(e){var t=e.split(`/`);return t[t.length-(e.slice(-1)==`/`?2:1)]}),i=!1;t.charCodeAt(0)===47?(i=!0,t=n[0].slice(0,-1)+t):i=t.indexOf(`/`)!==-1;var a=t.toUpperCase(),o=i===!0?n.indexOf(a):r.indexOf(a);if(o!==-1)return e.FileIndex[o];var s=!a.match(pe);for(a=a.replace(fe,``),s&&(a=a.replace(pe,`!`)),o=0;o<n.length;++o)if((s?n[o].replace(pe,`!`):n[o]).replace(fe,``)==a||(s?r[o].replace(pe,`!`):r[o]).replace(fe,``)==a)return e.FileIndex[o];return null}var D=64,O=-2,k=`d0cf11e0a1b11ae1`,A=[208,207,17,224,161,177,26,225],j=`00000000000000000000000000000000`,M={MAXREGSECT:-6,DIFSECT:-4,FATSECT:-3,ENDOFCHAIN:O,FREESECT:-1,HEADER_SIGNATURE:k,HEADER_MINOR_VERSION:`3e00`,MAXREGSID:-6,NOSTREAM:-1,HEADER_CLSID:j,EntryTypes:[`unknown`,`storage`,`stream`,`lockbytes`,`property`,`root`]};function N(e,t,n){c();var r=T(e,n);s.writeFileSync(t,r)}function P(e){for(var t=Array(e.length),n=0;n<e.length;++n)t[n]=String.fromCharCode(e[n]);return t.join(``)}function ee(e,t){var n=T(e,t);switch(t&&t.type||`buffer`){case`file`:return c(),s.writeFileSync(t.filename,n),n;case`binary`:return typeof n==`string`?n:P(n);case`base64`:return re(typeof n==`string`?n:P(n));case`buffer`:if(U)return Buffer.isBuffer(n)?n:ie(n);case`array`:return typeof n==`string`?se(n):n}return n}var F;function I(e){try{var t=e.InflateRaw,n=new t;if(n._processChunk(new Uint8Array([3,0]),n._finishFlushFlag),n.bytesRead)F=e;else throw Error(`zlib does not expose bytesRead`)}catch(e){console.error(`cannot use native zlib: `+(e.message||e))}}function te(e,t){if(!F)return Le(e,t);var n=F.InflateRaw,r=new n,i=r._processChunk(e.slice(e.l),r._finishFlushFlag);return e.l+=r.bytesRead,i}function ne(e){return F?F.deflateRawSync(e):ke(e)}var L=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],R=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258],z=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];function B(e){var t=(e<<1|e<<11)&139536|(e<<5|e<<15)&558144;return(t>>16|t>>8|t)&255}for(var V=typeof Uint8Array<`u`,ae=V?new Uint8Array(256):[],ce=0;ce<256;++ce)ae[ce]=B(ce);function le(e,t){var n=ae[e&255];return t<=8?n>>>8-t:(n=n<<8|ae[e>>8&255],t<=16?n>>>16-t:(n=n<<8|ae[e>>16&255],n>>>24-t))}function de(e,t){var n=t&7,r=t>>>3;return(e[r]|(n<=6?0:e[r+1]<<8))>>>n&3}function me(e,t){var n=t&7,r=t>>>3;return(e[r]|(n<=5?0:e[r+1]<<8))>>>n&7}function he(e,t){var n=t&7,r=t>>>3;return(e[r]|(n<=4?0:e[r+1]<<8))>>>n&15}function ge(e,t){var n=t&7,r=t>>>3;return(e[r]|(n<=3?0:e[r+1]<<8))>>>n&31}function _e(e,t){var n=t&7,r=t>>>3;return(e[r]|(n<=1?0:e[r+1]<<8))>>>n&127}function ve(e,t,n){var r=t&7,i=t>>>3,a=(1<<n)-1,o=e[i]>>>r;return n<8-r||(o|=e[i+1]<<8-r,n<16-r)||(o|=e[i+2]<<16-r,n<24-r)||(o|=e[i+3]<<24-r),o&a}function ye(e,t,n){var r=t&7,i=t>>>3;return r<=5?e[i]|=(n&7)<<r:(e[i]|=n<<r&255,e[i+1]=(n&7)>>8-r),t+3}function be(e,t,n){var r=t&7,i=t>>>3;return n=(n&1)<<r,e[i]|=n,t+1}function xe(e,t,n){var r=t&7,i=t>>>3;return n<<=r,e[i]|=n&255,n>>>=8,e[i+1]=n,t+8}function Se(e,t,n){var r=t&7,i=t>>>3;return n<<=r,e[i]|=n&255,n>>>=8,e[i+1]=n&255,e[i+2]=n>>>8,t+16}function Ce(e,t){var n=e.length,r=2*n>t?2*n:t+5,i=0;if(n>=t)return e;if(U){var a=W(r);if(e.copy)e.copy(a);else for(;i<e.length;++i)a[i]=e[i];return a}else if(V){var o=new Uint8Array(r);if(o.set)o.set(e);else for(;i<n;++i)o[i]=e[i];return o}return e.length=r,e}function we(e){for(var t=Array(e),n=0;n<e;++n)t[n]=0;return t}function Te(e,t,n){var r=1,i=0,a=0,o=0,s=0,c=e.length,l=V?new Uint16Array(32):we(32);for(a=0;a<32;++a)l[a]=0;for(a=c;a<n;++a)e[a]=0;c=e.length;var u=V?new Uint16Array(c):we(c);for(a=0;a<c;++a)l[i=e[a]]++,r<i&&(r=i),u[a]=0;for(l[0]=0,a=1;a<=r;++a)l[a+16]=s=s+l[a-1]<<1;for(a=0;a<c;++a)s=e[a],s!=0&&(u[a]=l[s+16]++);var d=0;for(a=0;a<c;++a)if(d=e[a],d!=0)for(s=le(u[a],r)>>r-d,o=(1<<r+4-d)-1;o>=0;--o)t[s|o<<d]=d&15|a<<4;return r}var G=V?new Uint16Array(512):we(512),Ee=V?new Uint16Array(32):we(32);if(!V){for(var De=0;De<512;++De)G[De]=0;for(De=0;De<32;++De)Ee[De]=0}(function(){for(var e=[],t=0;t<32;t++)e.push(5);Te(e,Ee,32);var n=[];for(t=0;t<=143;t++)n.push(8);for(;t<=255;t++)n.push(9);for(;t<=279;t++)n.push(7);for(;t<=287;t++)n.push(8);Te(n,G,288)})();var Oe=(function(){for(var e=V?new Uint8Array(32768):[],t=0,n=0;t<z.length-1;++t)for(;n<z[t+1];++n)e[n]=t;for(;n<32768;++n)e[n]=29;var r=V?new Uint8Array(259):[];for(t=0,n=0;t<R.length-1;++t)for(;n<R[t+1];++n)r[n]=t;function i(e,t){for(var n=0;n<e.length;){var r=Math.min(65535,e.length-n),i=n+r==e.length;for(t.write_shift(1,+i),t.write_shift(2,r),t.write_shift(2,~r&65535);r-->0;)t[t.l++]=e[n++]}return t.l}function a(t,n){for(var i=0,a=0,o=V?new Uint16Array(32768):[];a<t.length;){var s=Math.min(65535,t.length-a);if(s<10){for(i=ye(n,i,+(a+s==t.length)),i&7&&(i+=8-(i&7)),n.l=i/8|0,n.write_shift(2,s),n.write_shift(2,~s&65535);s-->0;)n[n.l++]=t[a++];i=n.l*8;continue}i=ye(n,i,+(a+s==t.length)+2);for(var c=0;s-->0;){var l=t[a];c=(c<<5^l)&32767;var u=-1,d=0;if((u=o[c])&&(u|=a&-32768,u>a&&(u-=32768),u<a))for(;t[u+d]==t[a+d]&&d<250;)++d;if(d>2){l=r[d],l<=22?i=xe(n,i,ae[l+1]>>1)-1:(xe(n,i,3),i+=5,xe(n,i,ae[l-23]>>5),i+=3);var f=l<8?0:l-4>>2;f>0&&(Se(n,i,d-R[l]),i+=f),l=e[a-u],i=xe(n,i,ae[l]>>3),i-=3;var p=l<4?0:l-2>>1;p>0&&(Se(n,i,a-u-z[l]),i+=p);for(var m=0;m<d;++m)o[c]=a&32767,c=(c<<5^t[a])&32767,++a;s-=d-1}else l<=143?l+=48:i=be(n,i,1),i=xe(n,i,ae[l]),o[c]=a&32767,++a}i=xe(n,i,0)-1}return n.l=(i+7)/8|0,n.l}return function(e,t){return e.length<8?i(e,t):a(e,t)}})();function ke(e){var t=Rr(50+Math.floor(e.length*1.1)),n=Oe(e,t);return t.slice(0,n)}var Ae=V?new Uint16Array(32768):we(32768),je=V?new Uint16Array(32768):we(32768),Me=V?new Uint16Array(128):we(128),Ne=1,Pe=1;function Fe(e,t){var n=ge(e,t)+257;t+=5;var r=ge(e,t)+1;t+=5;var i=he(e,t)+4;t+=4;for(var a=0,o=V?new Uint8Array(19):we(19),s=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],c=1,l=V?new Uint8Array(8):we(8),u=V?new Uint8Array(8):we(8),d=o.length,f=0;f<i;++f)o[L[f]]=a=me(e,t),c<a&&(c=a),l[a]++,t+=3;var p=0;for(l[0]=0,f=1;f<=c;++f)u[f]=p=p+l[f-1]<<1;for(f=0;f<d;++f)(p=o[f])!=0&&(s[f]=u[p]++);var m=0;for(f=0;f<d;++f)if(m=o[f],m!=0){p=ae[s[f]]>>8-m;for(var h=(1<<7-m)-1;h>=0;--h)Me[p|h<<m]=m&7|f<<3}var g=[];for(c=1;g.length<n+r;)switch(p=Me[_e(e,t)],t+=p&7,p>>>=3){case 16:for(a=3+de(e,t),t+=2,p=g[g.length-1];a-->0;)g.push(p);break;case 17:for(a=3+me(e,t),t+=3;a-->0;)g.push(0);break;case 18:for(a=11+_e(e,t),t+=7;a-->0;)g.push(0);break;default:g.push(p),c<p&&(c=p);break}var _=g.slice(0,n),v=g.slice(n);for(f=n;f<286;++f)_[f]=0;for(f=r;f<30;++f)v[f]=0;return Ne=Te(_,Ae,286),Pe=Te(v,je,30),t}function Ie(e,t){if(e[0]==3&&!(e[1]&3))return[oe(t),2];for(var n=0,r=0,i=W(t||1<<18),a=0,o=i.length>>>0,s=0,c=0;!(r&1);){if(r=me(e,n),n+=3,r>>>1)r>>1==1?(s=9,c=5):(n=Fe(e,n),s=Ne,c=Pe);else{n&7&&(n+=8-(n&7));var l=e[n>>>3]|e[(n>>>3)+1]<<8;if(n+=32,l>0)for(!t&&o<a+l&&(i=Ce(i,a+l),o=i.length);l-->0;)i[a++]=e[n>>>3],n+=8;continue}for(;;){!t&&o<a+32767&&(i=Ce(i,a+32767),o=i.length);var u=ve(e,n,s),d=r>>>1==1?G[u]:Ae[u];if(n+=d&15,d>>>=4,!(d>>>8&255))i[a++]=d;else if(d==256)break;else{d-=257;var f=d<8?0:d-4>>2;f>5&&(f=0);var p=a+R[d];f>0&&(p+=ve(e,n,f),n+=f),u=ve(e,n,c),d=r>>>1==1?Ee[u]:je[u],n+=d&15,d>>>=4;var m=d<4?0:d-2>>1,h=z[d];for(m>0&&(h+=ve(e,n,m),n+=m),!t&&o<p&&(i=Ce(i,p+100),o=i.length);a<p;)i[a]=i[a-h],++a}}}return t?[i,n+7>>>3]:[i.slice(0,a),n+7>>>3]}function Le(e,t){var n=Ie(e.slice(e.l||0),t);return e.l+=n[1],n[0]}function Re(e,t){if(e)typeof console<`u`&&console.error(t);else throw Error(t)}function ze(e,t){var n=e;Ir(n,0);var r={FileIndex:[],FullPaths:[]};S(r,{root:t.root});for(var i=n.length-4;(n[i]!=80||n[i+1]!=75||n[i+2]!=5||n[i+3]!=6)&&i>=0;)--i;n.l=i+4,n.l+=4;var a=n.read_shift(2);for(n.l+=6,n.l=n.read_shift(4),i=0;i<a;++i){n.l+=20;var s=n.read_shift(4),c=n.read_shift(4),l=n.read_shift(2),u=n.read_shift(2),d=n.read_shift(2);n.l+=8;var f=n.read_shift(4),p=o(n.slice(n.l+l,n.l+l+u));n.l+=l+u+d;var m=n.l;n.l=f+4,p&&p[1]&&((p[1]||{}).usz&&(c=p[1].usz),(p[1]||{}).csz&&(s=p[1].csz)),Be(n,s,c,r,p),n.l=m}return r}function Be(e,t,n,r,i){e.l+=2;var s=e.read_shift(2),c=e.read_shift(2),l=a(e);if(s&8257)throw Error(`Unsupported ZIP encryption`);for(var u=e.read_shift(4),d=e.read_shift(4),f=e.read_shift(4),p=e.read_shift(2),m=e.read_shift(2),h=``,g=0;g<p;++g)h+=String.fromCharCode(e[e.l++]);if(m){var _=o(e.slice(e.l,e.l+m));(_[21589]||{}).mt&&(l=_[21589].mt),(_[1]||{}).usz&&(f=_[1].usz),(_[1]||{}).csz&&(d=_[1].csz),i&&((i[21589]||{}).mt&&(l=i[21589].mt),(i[1]||{}).usz&&(f=i[1].usz),(i[1]||{}).csz&&(d=i[1].csz))}e.l+=m;var v=e.slice(e.l,e.l+d);switch(c){case 8:v=te(e,f);break;case 0:e.l+=d;break;default:throw Error(`Unsupported ZIP Compression method `+c)}var y=!1;s&8&&(u=e.read_shift(4),u==134695760&&(u=e.read_shift(4),y=!0),d=e.read_shift(4),f=e.read_shift(4)),d!=t&&Re(y,`Bad compressed size: `+t+` != `+d),f!=n&&Re(y,`Bad uncompressed size: `+n+` != `+f),Ze(r,h,v,{unsafe:!0,mt:l})}function Ve(e,t){var n=t||{},r=[],a=[],o=Rr(1),s=n.compression?8:0,c=0,l=0,u=0,d=0,f=0,p=e.FullPaths[0],m=p,h=e.FileIndex[0],g=[],_=0;for(l=1;l<e.FullPaths.length;++l)if(m=e.FullPaths[l].slice(p.length),h=e.FileIndex[l],!(!h.size||!h.content||Array.isArray(h.content)&&h.content.length==0||m==`Sh33tJ5`)){var v=d,y=Rr(m.length);for(u=0;u<m.length;++u)y.write_shift(1,m.charCodeAt(u)&127);y=y.slice(0,y.l),g[f]=typeof h.content==`string`?Ct.bstr(h.content,0):Ct.buf(h.content,0);var b=typeof h.content==`string`?se(h.content):h.content;s==8&&(b=ne(b)),o=Rr(30),o.write_shift(4,67324752),o.write_shift(2,20),o.write_shift(2,c),o.write_shift(2,s),h.mt?i(o,h.mt):o.write_shift(4,0),o.write_shift(-4,c&8?0:g[f]),o.write_shift(4,c&8?0:b.length),o.write_shift(4,c&8?0:h.content.length),o.write_shift(2,y.length),o.write_shift(2,0),d+=o.length,r.push(o),d+=y.length,r.push(y),d+=b.length,r.push(b),c&8&&(o=Rr(12),o.write_shift(-4,g[f]),o.write_shift(4,b.length),o.write_shift(4,h.content.length),d+=o.l,r.push(o)),o=Rr(46),o.write_shift(4,33639248),o.write_shift(2,0),o.write_shift(2,20),o.write_shift(2,c),o.write_shift(2,s),o.write_shift(4,0),o.write_shift(-4,g[f]),o.write_shift(4,b.length),o.write_shift(4,h.content.length),o.write_shift(2,y.length),o.write_shift(2,0),o.write_shift(2,0),o.write_shift(2,0),o.write_shift(2,0),o.write_shift(4,0),o.write_shift(4,v),_+=o.l,a.push(o),_+=y.length,a.push(y),++f}return o=Rr(22),o.write_shift(4,101010256),o.write_shift(2,0),o.write_shift(2,0),o.write_shift(2,f),o.write_shift(2,f),o.write_shift(4,_),o.write_shift(4,d),o.write_shift(2,0),ue([ue(r),ue(a),o])}var He={htm:`text/html`,xml:`text/xml`,gif:`image/gif`,jpg:`image/jpeg`,png:`image/png`,mso:`application/x-mso`,thmx:`application/vnd.ms-officetheme`,sh33tj5:`application/octet-stream`};function Ue(e,t){if(e.ctype)return e.ctype;var n=e.name||``,r=n.match(/\.([^\.]+)$/);return r&&He[r[1]]||t&&(r=(n=t).match(/[\.\\]([^\.\\])+$/),r&&He[r[1]])?He[r[1]]:`application/octet-stream`}function We(e){for(var t=re(e),n=[],r=0;r<t.length;r+=76)n.push(t.slice(r,r+76));return n.join(`\r
`)+`\r
`}function Ge(e){var t=e.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF=]/g,function(e){var t=e.charCodeAt(0).toString(16).toUpperCase();return`=`+(t.length==1?`0`+t:t)});t=t.replace(/ $/gm,`=20`).replace(/\t$/gm,`=09`),t.charAt(0)==`
`&&(t=`=0D`+t.slice(1)),t=t.replace(/\r(?!\n)/gm,`=0D`).replace(/\n\n/gm,`
=0A`).replace(/([^\r\n])\n/gm,`$1=0A`);for(var n=[],r=t.split(`\r
`),i=0;i<r.length;++i){var a=r[i];if(a.length==0){n.push(``);continue}for(var o=0;o<a.length;){var s=76,c=a.slice(o,o+s);c.charAt(s-1)==`=`?s--:c.charAt(s-2)==`=`?s-=2:c.charAt(s-3)==`=`&&(s-=3),c=a.slice(o,o+s),o+=s,o<a.length&&(c+=`=`),n.push(c)}}return n.join(`\r
`)}function Ke(e){for(var t=[],n=0;n<e.length;++n){for(var r=e[n];n<=e.length&&r.charAt(r.length-1)==`=`;)r=r.slice(0,r.length-1)+e[++n];t.push(r)}for(var i=0;i<t.length;++i)t[i]=t[i].replace(/[=][0-9A-Fa-f]{2}/g,function(e){return String.fromCharCode(parseInt(e.slice(1),16))});return se(t.join(`\r
`))}function qe(e,t,n){for(var r=``,i=``,a=``,o,s=0;s<10;++s){var c=t[s];if(!c||c.match(/^\s*$/))break;var l=c.match(/^([^:]*?):\s*([^\s].*)$/);if(l)switch(l[1].toLowerCase()){case`content-location`:r=l[2].trim();break;case`content-type`:a=l[2].trim();break;case`content-transfer-encoding`:i=l[2].trim();break}}switch(++s,i.toLowerCase()){case`base64`:o=se(H(t.slice(s).join(``)));break;case`quoted-printable`:o=Ke(t.slice(s));break;default:throw Error(`Unsupported Content-Transfer-Encoding `+i)}var u=Ze(e,r.slice(n.length),o,{unsafe:!0});a&&(u.ctype=a)}function Je(e,t){if(P(e.slice(0,13)).toLowerCase()!=`mime-version:`)throw Error(`Unsupported MAD header`);var n=t&&t.root||``,r=(U&&Buffer.isBuffer(e)?e.toString(`binary`):P(e)).split(`\r
`),i=0,a=``;for(i=0;i<r.length;++i)if(a=r[i],/^Content-Location:/i.test(a)&&(a=a.slice(a.indexOf(`file`)),n||=a.slice(0,a.lastIndexOf(`/`)+1),a.slice(0,n.length)!=n))for(;n.length>0&&(n=n.slice(0,n.length-1),n=n.slice(0,n.lastIndexOf(`/`)+1),a.slice(0,n.length)!=n););var o=(r[1]||``).match(/boundary="(.*?)"/);if(!o)throw Error(`MAD cannot find boundary`);var s=`--`+(o[1]||``),c={FileIndex:[],FullPaths:[]};S(c);var l,u=0;for(i=0;i<r.length;++i){var d=r[i];d!==s&&d!==s+`--`||(u++&&qe(c,r.slice(l,i),n),l=i)}return c}function Ye(e,t){var n=t||{},r=n.boundary||`SheetJS`;r=`------=`+r;for(var i=[`MIME-Version: 1.0`,`Content-Type: multipart/related; boundary="`+r.slice(2)+`"`,``,``,``],a=e.FullPaths[0],o=a,s=e.FileIndex[0],c=1;c<e.FullPaths.length;++c)if(o=e.FullPaths[c].slice(a.length),s=e.FileIndex[c],!(!s.size||!s.content||o==`Sh33tJ5`)){o=o.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF]/g,function(e){return`_x`+e.charCodeAt(0).toString(16)+`_`}).replace(/[\u0080-\uFFFF]/g,function(e){return`_u`+e.charCodeAt(0).toString(16)+`_`});for(var l=s.content,u=U&&Buffer.isBuffer(l)?l.toString(`binary`):P(l),d=0,f=Math.min(1024,u.length),p=0,m=0;m<=f;++m)(p=u.charCodeAt(m))>=32&&p<128&&++d;var h=d>=f*4/5;i.push(r),i.push(`Content-Location: `+(n.root||`file:///C:/SheetJS/`)+o),i.push(`Content-Transfer-Encoding: `+(h?`quoted-printable`:`base64`)),i.push(`Content-Type: `+Ue(s,o)),i.push(``),i.push(h?Ge(u):We(u))}return i.push(r+`--\r
`),i.join(`\r
`)}function Xe(e){var t={};return S(t,e),t}function Ze(e,t,n,i){var a=i&&i.unsafe;a||S(e);var o=!a&&K.find(e,t);if(!o){var s=e.FullPaths[0];t.slice(0,s.length)==s?s=t:(s.slice(-1)!=`/`&&(s+=`/`),s=(s+t).replace(`//`,`/`)),o={name:r(t),type:2},e.FileIndex.push(o),e.FullPaths.push(s),a||K.utils.cfb_gc(e)}return o.content=n,o.size=n?n.length:0,i&&(i.CLSID&&(o.clsid=i.CLSID),i.mt&&(o.mt=i.mt),i.ct&&(o.ct=i.ct)),o}function Qe(e,t){S(e);var n=K.find(e,t);if(n){for(var r=0;r<e.FileIndex.length;++r)if(e.FileIndex[r]==n)return e.FileIndex.splice(r,1),e.FullPaths.splice(r,1),!0}return!1}function $e(e,t,n){S(e);var i=K.find(e,t);if(i){for(var a=0;a<e.FileIndex.length;++a)if(e.FileIndex[a]==i)return e.FileIndex[a].name=r(n),e.FullPaths[a]=n,!0}return!1}function et(e){w(e,!0)}return e.find=E,e.read=x,e.parse=l,e.write=ee,e.writeFile=N,e.utils={cfb_new:Xe,cfb_add:Ze,cfb_del:Qe,cfb_mov:$e,cfb_gc:et,ReadShift:Ar,CheckField:Fr,prep_blob:Ir,bconcat:ue,use_zlib:I,_deflateRaw:ke,_inflateRaw:Le,consts:M},e})(),wt;function Tt(e){if(wt!==void 0)return wt.readFileSync(e);if(typeof Deno<`u`)return Deno.readFileSync(e);if(typeof $<`u`&&typeof File<`u`&&typeof Folder<`u`)try{var t=File(e);t.open(`r`),t.encoding=`binary`;var n=t.read();return t.close(),n}catch(e){if(!e.message||e.message.indexOf(`onstruct`)==-1)throw e}throw Error(`Cannot access file `+e)}function Et(e){for(var t=Object.keys(e),n=[],r=0;r<t.length;++r)Object.prototype.hasOwnProperty.call(e,t[r])&&n.push(t[r]);return n}function Dt(e){for(var t=[],n=Et(e),r=0;r!==n.length;++r)t[e[n[r]]]=n[r];return t}var Ot=Date.UTC(1899,11,30,0,0,0),kt=Date.UTC(1899,11,31,0,0,0),At=Date.UTC(1904,0,1,0,0,0);function jt(e,t){var n=(e.getTime()-Ot)/(1440*60*1e3);return t?(n-=1462,n<-1402?n-1:n):n<60?n-1:n}function Mt(e){if(e>=60&&e<61)return e;var t=new Date;return t.setTime((e>60?e:e+1)*24*60*60*1e3+Ot),t}function Nt(e){var t=0,n=0,r=!1,i=e.match(/P([0-9\.]+Y)?([0-9\.]+M)?([0-9\.]+D)?T([0-9\.]+H)?([0-9\.]+M)?([0-9\.]+S)?/);if(!i)throw Error(`|`+e+`| is not an ISO8601 Duration`);for(var a=1;a!=i.length;++a)if(i[a]){switch(n=1,a>3&&(r=!0),i[a].slice(i[a].length-1)){case`Y`:throw Error(`Unsupported ISO Duration Field: `+i[a].slice(i[a].length-1));case`D`:n*=24;case`H`:n*=60;case`M`:if(r)n*=60;else throw Error(`Unsupported ISO Duration Field: M`);case`S`:break}t+=n*parseInt(i[a],10)}return t}var Pt=/^(\d+):(\d+)(:\d+)?(\.\d+)?$/,Ft=/^(\d+)-(\d+)-(\d+)$/,It=/^(\d+)-(\d+)-(\d+)[T ](\d+):(\d+)(:\d+)?(\.\d+)?$/;function Lt(e,t){if(e instanceof Date)return e;var n=e.match(Pt);return n?new Date((t?At:kt)+((parseInt(n[1],10)*60+parseInt(n[2],10))*60+(n[3]?parseInt(n[3].slice(1),10):0))*1e3+(n[4]?parseInt((n[4]+`000`).slice(1,4),10):0)):(n=e.match(Ft),n?new Date(Date.UTC(+n[1],n[2]-1,+n[3],0,0,0,0)):(n=e.match(It),n?new Date(Date.UTC(+n[1],n[2]-1,+n[3],+n[4],+n[5],n[6]&&parseInt(n[6].slice(1),10)||0,n[7]&&parseInt((n[7]+`0000`).slice(1,4),10)||0)):new Date(e)))}function Rt(e,t){if(U&&Buffer.isBuffer(e)){if(t&&ae){if(e[0]==255&&e[1]==254)return Hn(e.slice(2).toString(`utf16le`));if(e[1]==254&&e[2]==255)return Hn(te(e.slice(2).toString(`binary`)))}return e.toString(`binary`)}if(typeof TextDecoder<`u`)try{if(t){if(e[0]==255&&e[1]==254)return Hn(new TextDecoder(`utf-16le`).decode(e.slice(2)));if(e[0]==254&&e[1]==255)return Hn(new TextDecoder(`utf-16be`).decode(e.slice(2)))}var n={"€":``,"‚":``,ƒ:``,"„":``,"…":``,"†":``,"‡":``,ˆ:``,"‰":``,Š:``,"‹":``,Œ:``,Ž:``,"‘":``,"’":``,"“":``,"”":``,"•":``,"–":``,"—":``,"˜":``,"™":``,š:``,"›":``,œ:``,ž:``,Ÿ:``};return Array.isArray(e)&&(e=new Uint8Array(e)),new TextDecoder(`latin1`).decode(e).replace(/[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g,function(e){return n[e]||e})}catch{}var r=[],i=0;try{for(i=0;i<e.length-65536;i+=65536)r.push(String.fromCharCode.apply(0,e.slice(i,i+65536)));r.push(String.fromCharCode.apply(0,e.slice(i)))}catch{try{for(;i<e.length-16384;i+=16384)r.push(String.fromCharCode.apply(0,e.slice(i,i+16384)));r.push(String.fromCharCode.apply(0,e.slice(i)))}catch{for(;i!=e.length;++i)r.push(String.fromCharCode(e[i]))}}return r.join(``)}function zt(e){if(typeof JSON<`u`&&!Array.isArray(e))return JSON.parse(JSON.stringify(e));if(typeof e!=`object`||!e)return e;if(e instanceof Date)return new Date(e.getTime());var t={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=zt(e[n]));return t}function Bt(e,t){for(var n=``;n.length<t;)n+=e;return n}function Vt(e){var t=Number(e);if(!isNaN(t))return isFinite(t)?t:NaN;if(!/\d/.test(e))return t;var n=1,r=e.replace(/([\d]),([\d])/g,`$1$2`).replace(/[$]/g,``).replace(/[%]/g,function(){return n*=100,``});return!isNaN(t=Number(r))||(r=r.replace(/[(]([^()]*)[)]/,function(e,t){return n=-n,t}),!isNaN(t=Number(r)))?t/n:t}var Ht=/^(0?\d|1[0-2])(?:|:([0-5]?\d)(?:|(\.\d+)(?:|:([0-5]?\d))|:([0-5]?\d)(|\.\d+)))\s+([ap])m?$/,Ut=/^([01]?\d|2[0-3])(?:|:([0-5]?\d)(?:|(\.\d+)(?:|:([0-5]?\d))|:([0-5]?\d)(|\.\d+)))$/,Wt=/^(\d+)-(\d+)-(\d+)[T ](\d+):(\d+)(:\d+)(\.\d+)?[Z]?$/,Gt=new Date(`6/9/69 00:00 UTC`).valueOf()==-177984e5;function Kt(e){return e[2]?e[3]?e[4]?new Date(Date.UTC(1899,11,31,e[1]%12+(e[7]==`p`?12:0),+e[2],+e[4],parseFloat(e[3])*1e3)):new Date(Date.UTC(1899,11,31,e[7]==`p`?12:0,+e[1],+e[2],parseFloat(e[3])*1e3)):e[5]?new Date(Date.UTC(1899,11,31,e[1]%12+(e[7]==`p`?12:0),+e[2],+e[5],e[6]?parseFloat(e[6])*1e3:0)):new Date(Date.UTC(1899,11,31,e[1]%12+(e[7]==`p`?12:0),+e[2],0,0)):new Date(Date.UTC(1899,11,31,e[1]%12+(e[7]==`p`?12:0),0,0,0))}function qt(e){return e[2]?e[3]?e[4]?new Date(Date.UTC(1899,11,31,+e[1],+e[2],+e[4],parseFloat(e[3])*1e3)):new Date(Date.UTC(1899,11,31,0,+e[1],+e[2],parseFloat(e[3])*1e3)):e[5]?new Date(Date.UTC(1899,11,31,+e[1],+e[2],+e[5],e[6]?parseFloat(e[6])*1e3:0)):new Date(Date.UTC(1899,11,31,+e[1],+e[2],0,0)):new Date(Date.UTC(1899,11,31,+e[1],0,0,0))}var Jt=[`january`,`february`,`march`,`april`,`may`,`june`,`july`,`august`,`september`,`october`,`november`,`december`];function Yt(e){if(Wt.test(e))return e.indexOf(`Z`)==-1?Qt(new Date(e)):new Date(e);var t=e.toLowerCase(),n=t.replace(/\s+/g,` `).trim(),r=n.match(Ht);if(r)return Kt(r);if(r=n.match(Ut),r)return qt(r);if(r=n.match(It),r)return new Date(Date.UTC(+r[1],r[2]-1,+r[3],+r[4],+r[5],r[6]&&parseInt(r[6].slice(1),10)||0,r[7]&&parseInt((r[7]+`0000`).slice(1,4),10)||0));var i=new Date(Gt&&e.indexOf(`UTC`)==-1?e+` UTC`:e),a=new Date(NaN),o=i.getYear();i.getMonth();var s=i.getDate();if(isNaN(s))return a;if(t.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/)){if(t=t.replace(/[^a-z]/g,``).replace(/([^a-z]|^)[ap]m?([^a-z]|$)/,``),t.length>3&&Jt.indexOf(t)==-1)return a}else if(t.replace(/[ap]m?/,``).match(/[a-z]/))return a;return o<0||o>8099||e.match(/[^-0-9:,\/\\\ ]/)?a:i}var Xt=(function(){var e=`abacaba`.split(/(:?b)/i).length==5;return function(t,n,r){if(e||typeof n==`string`)return t.split(n);for(var i=t.split(n),a=[i[0]],o=1;o<i.length;++o)a.push(r),a.push(i[o]);return a}})();function Zt(e){return new Date(e.getUTCFullYear(),e.getUTCMonth(),e.getUTCDate(),e.getUTCHours(),e.getUTCMinutes(),e.getUTCSeconds(),e.getUTCMilliseconds())}function Qt(e){return new Date(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate(),e.getHours(),e.getMinutes(),e.getSeconds(),e.getMilliseconds()))}function $t(e){var t=e.slice(0,1024).indexOf(`<!DOCTYPE`);if(t==-1)return e;var n=e.match(/<[\w]/);return n?e.slice(0,t)+e.slice(n.index):e}function en(e,t,n){for(var r=[],i=e.indexOf(t);i>-1;){var a=e.indexOf(n,i+t.length);if(a==-1)break;r.push(e.slice(i,a+n.length)),i=e.indexOf(t,a+n.length)}return r.length>0?r:null}function tn(e,t,n){var r=[],i=0,a=e.indexOf(t);if(a==-1)return e;for(;a>-1;){r.push(e.slice(i,a));var o=e.indexOf(n,a+t.length);if(o==-1)break;(a=e.indexOf(t,i=o+n.length))==-1&&r.push(e.slice(i))}return r.join(``)}var nn={" ":1,"	":1,"\r":1,"\n":1,">":1};function rn(e,t){for(var n=e.indexOf(`<`+t),r=t.length+1,i=e.length;n>=0&&n<=i-r&&!nn[e.charAt(n+r)];)n=e.indexOf(`<`+t,n+1);if(n===-1)return null;var a=e.indexOf(`>`,n+t.length);if(a===-1)return null;var o=`</`+t+`>`,s=e.indexOf(o,a);return s==-1?null:[e.slice(n,s+o.length),e.slice(a+1,s)]}var an=(function(){var e={};return function(t,n){var r=e[n];r||(e[n]=r=[RegExp(`<(?:\\w+:)?`+n+`\\b[^<>]*>`,`g`),RegExp(`</(?:\\w+:)?`+n+`>`,`g`)]),r[0].lastIndex=r[1].lastIndex=0;var i=r[0].exec(t);if(!i)return null;var a=i.index,o=r[0].lastIndex;if(r[1].lastIndex=r[0].lastIndex,i=r[1].exec(t),!i)return null;var s=i.index,c=r[1].lastIndex;return[t.slice(a,c),t.slice(o,s)]}})(),on=(function(){var e={};return function(t,n){var r=[],i=e[n];i||(e[n]=i=[RegExp(`<(?:\\w+:)?`+n+`\\b[^<>]*>`,`g`),RegExp(`</(?:\\w+:)?`+n+`>`,`g`)]),i[0].lastIndex=i[1].lastIndex=0;for(var a;a=i[0].exec(t);){var o=a.index;if(i[1].lastIndex=i[0].lastIndex,a=i[1].exec(t),!a)return null;var s=i[1].lastIndex;r.push(t.slice(o,s)),i[0].lastIndex=i[1].lastIndex}return r.length==0?null:r}})(),sn=(function(){var e={};return function(t,n){var r=[],i=e[n];i||(e[n]=i=[RegExp(`<(?:\\w+:)?`+n+`\\b[^<>]*>`,`g`),RegExp(`</(?:\\w+:)?`+n+`>`,`g`)]),i[0].lastIndex=i[1].lastIndex=0;for(var a,o=0,s=0;a=i[0].exec(t);){if(o=a.index,r.push(t.slice(s,o)),s=o,i[1].lastIndex=i[0].lastIndex,a=i[1].exec(t),!a)return null;s=i[1].lastIndex,i[0].lastIndex=i[1].lastIndex}return r.push(t.slice(s)),r.length==0?``:r.join(``)}})(),cn=(function(){var e={};return function(t,n){var r=[],i=e[n];i||(e[n]=i=[RegExp(`<`+n+`\\b[^<>]*>`,`ig`),RegExp(`</`+n+`>`,`ig`)]),i[0].lastIndex=i[1].lastIndex=0;for(var a;a=i[0].exec(t);){var o=a.index;if(i[1].lastIndex=i[0].lastIndex,a=i[1].exec(t),!a)return null;var s=i[1].lastIndex;r.push(t.slice(o,s)),i[0].lastIndex=i[1].lastIndex}return r.length==0?null:r}})();function ln(e){return e?e.content&&e.type?Rt(e.content,!0):e.data?ne(e.data):e.asNodeBuffer&&U?ne(e.asNodeBuffer().toString(`binary`)):e.asBinary?ne(e.asBinary()):e._data&&e._data.getContent?ne(Rt(Array.prototype.slice.call(e._data.getContent(),0))):null:null}function un(e){if(!e)return null;if(e.data)return ee(e.data);if(e.asNodeBuffer&&U)return e.asNodeBuffer();if(e._data&&e._data.getContent){var t=e._data.getContent();return typeof t==`string`?ee(t):Array.prototype.slice.call(t)}return e.content&&e.type?e.content:null}function dn(e){return e&&e.name.slice(-4)===`.bin`?un(e):ln(e)}function fn(e,t){for(var n=e.FullPaths||Et(e.files),r=t.toLowerCase().replace(/[\/]/g,`\\`),i=r.replace(/\\/g,`/`),a=0;a<n.length;++a){var o=n[a].replace(/^Root Entry[\/]/,``).toLowerCase();if(r==o||i==o)return e.files?e.files[n[a]]:e.FileIndex[a]}return null}function pn(e,t){var n=fn(e,t);if(n==null)throw Error(`Cannot find file `+t+` in zip`);return n}function mn(e,t,n){if(!n)return dn(pn(e,t));if(!t)return null;try{return mn(e,t)}catch{return null}}function hn(e,t,n){if(!n)return ln(pn(e,t));if(!t)return null;try{return hn(e,t)}catch{return null}}function gn(e,t,n){if(!n)return un(pn(e,t));if(!t)return null;try{return gn(e,t)}catch{return null}}function _n(e){for(var t=e.FullPaths||Et(e.files),n=[],r=0;r<t.length;++r)t[r].slice(-1)!=`/`&&n.push(t[r].replace(/^Root Entry[\/]/,``));return n.sort()}function vn(e,t,n){if(e.FullPaths){if(Array.isArray(n)&&typeof n[0]==`string`&&(n=n.join(``)),typeof n==`string`){var r=U?ie(n):de(n);return K.utils.cfb_add(e,t,r)}K.utils.cfb_add(e,t,n)}else e.file(t,n)}function yn(e,t){switch(t.type){case`base64`:return K.read(e,{type:`base64`});case`binary`:return K.read(e,{type:`binary`});case`buffer`:case`array`:return K.read(e,{type:`buffer`})}throw Error(`Unrecognized type `+t.type)}function bn(e,t){if(e.charAt(0)==`/`)return e.slice(1);var n=t.split(`/`);t.slice(-1)!=`/`&&n.pop();for(var r=e.split(`/`);r.length!==0;){var i=r.shift();i===`..`?n.pop():i!==`.`&&n.push(i)}return n.join(`/`)}var xn=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r
`,Sn=/\s([^"\s?>\/]+)\s*=\s*((?:")([^"]*)(?:")|(?:')([^']*)(?:')|([^'">\s]+))/g,Cn=/<[\/\?]?[a-zA-Z0-9:_-]+(?:\s+[^"\s?<>\/]+\s*=\s*(?:"[^"]*"|'[^']*'|[^'"<>\s=]+))*\s*[\/\?]?>/gm,wn=xn.match(Cn)?Cn:/<[^<>]*>/g,Tn=/<\w*:/,En=/<(\/?)\w+:/;function q(e,t,n){for(var r={},i=0,a=0;i!==e.length&&!((a=e.charCodeAt(i))===32||a===10||a===13);++i);if(t||(r[0]=e.slice(0,i)),i===e.length)return r;var o=e.match(Sn),s=0,c=``,l=0,u=``,d=``,f=1;if(o)for(l=0;l!=o.length;++l){for(d=o[l].slice(1),a=0;a!=d.length&&d.charCodeAt(a)!==61;++a);for(u=d.slice(0,a).trim();d.charCodeAt(a+1)==32;)++a;for(f=+((i=d.charCodeAt(a+1))==34||i==39),c=d.slice(a+1+f,d.length-f),s=0;s!=u.length&&u.charCodeAt(s)!==58;++s);if(s===u.length)u.indexOf(`_`)>0&&(u=u.slice(0,u.indexOf(`_`))),r[u]=c,n||(r[u.toLowerCase()]=c);else{var p=(s===5&&u.slice(0,5)===`xmlns`?`xmlns`:``)+u.slice(s+1);if(r[p]&&u.slice(s-3,s)==`ext`)continue;r[p]=c,n||(r[p.toLowerCase()]=c)}}return r}function Dn(e,t,n){for(var r={},i=0,a=0;i!==e.length&&!((a=e.charCodeAt(i))===32||a===10||a===13);++i);if(t||(r[0]=e.slice(0,i)),i===e.length)return r;var o=e.match(Sn),s=``,c=0,l=``,u=``,d=1;if(o)for(c=0;c!=o.length;++c){for(u=o[c].slice(1),a=0;a!=u.length&&u.charCodeAt(a)!==61;++a);for(l=u.slice(0,a).trim();u.charCodeAt(a+1)==32;)++a;d=+((i=u.charCodeAt(a+1))==34||i==39),s=u.slice(a+1+d,u.length-d),l.indexOf(`_`)>0&&(l=l.slice(0,l.indexOf(`_`))),r[l]=s,n||(r[l.toLowerCase()]=s)}return r}function On(e){return e.replace(En,`<$1`)}var kn={"&quot;":`"`,"&apos;":`'`,"&gt;":`>`,"&lt;":`<`,"&amp;":`&`},An=Dt(kn),jn=(function(){var e=/&(?:quot|apos|gt|lt|amp|#x?([\da-fA-F]+));/gi,t=/_x([\da-fA-F]{4})_/gi;function n(r){var i=r+``,a=i.indexOf(`<![CDATA[`);if(a==-1)return i.replace(e,function(e,t){return kn[e]||String.fromCharCode(parseInt(t,e.indexOf(`x`)>-1?16:10))||e}).replace(t,function(e,t){return String.fromCharCode(parseInt(t,16))});var o=i.indexOf(`]]>`);return n(i.slice(0,a))+i.slice(a+9,o)+n(i.slice(o+3))}return function(e,t){var r=n(e);return t?r.replace(/\r\n/g,`
`):r}})(),Mn=/[&<>'"]/g,Nn=/[\u0000-\u001f]/g;function Pn(e){return(e+``).replace(Mn,function(e){return An[e]}).replace(/\n/g,`<br/>`).replace(Nn,function(e){return`&#x`+(`000`+e.charCodeAt(0).toString(16)).slice(-4)+`;`})}var Fn=(function(){var e=/&#(\d+);/g;function t(e,t){return String.fromCharCode(parseInt(t,10))}return function(n){return n.replace(e,t)}})();function In(e){switch(e){case 1:case!0:case`1`:case`true`:return!0;case 0:case!1:case`0`:case`false`:return!1}return!1}function Ln(e){for(var t=``,n=0,r=0,i=0,a=0,o=0,s=0;n<e.length;){if(r=e.charCodeAt(n++),r<128){t+=String.fromCharCode(r);continue}if(i=e.charCodeAt(n++),r>191&&r<224){o=(r&31)<<6,o|=i&63,t+=String.fromCharCode(o);continue}if(a=e.charCodeAt(n++),r<240){t+=String.fromCharCode((r&15)<<12|(i&63)<<6|a&63);continue}o=e.charCodeAt(n++),s=((r&7)<<18|(i&63)<<12|(a&63)<<6|o&63)-65536,t+=String.fromCharCode(55296+(s>>>10&1023)),t+=String.fromCharCode(56320+(s&1023))}return t}function Rn(e){var t=oe(2*e.length),n,r,i=1,a=0,o=0,s;for(r=0;r<e.length;r+=i)i=1,(s=e.charCodeAt(r))<128?n=s:s<224?(n=(s&31)*64+(e.charCodeAt(r+1)&63),i=2):s<240?(n=(s&15)*4096+(e.charCodeAt(r+1)&63)*64+(e.charCodeAt(r+2)&63),i=3):(i=4,n=(s&7)*262144+(e.charCodeAt(r+1)&63)*4096+(e.charCodeAt(r+2)&63)*64+(e.charCodeAt(r+3)&63),n-=65536,o=55296+(n>>>10&1023),n=56320+(n&1023)),o!==0&&(t[a++]=o&255,t[a++]=o>>>8,o=0),t[a++]=n%256,t[a++]=n>>>8;return t.slice(0,a).toString(`ucs2`)}function zn(e){return ie(e,`binary`).toString(`utf8`)}var Bn=`foo bar bazâð£`,Vn=U&&(zn(Bn)==Ln(Bn)&&zn||Rn(Bn)==Ln(Bn)&&Rn)||Ln,Hn=U?function(e){return ie(e,`utf8`).toString(`binary`)}:function(e){for(var t=[],n=0,r=0,i=0;n<e.length;)switch(r=e.charCodeAt(n++),!0){case r<128:t.push(String.fromCharCode(r));break;case r<2048:t.push(String.fromCharCode(192+(r>>6))),t.push(String.fromCharCode(128+(r&63)));break;case r>=55296&&r<57344:r-=55296,i=e.charCodeAt(n++)-56320+(r<<10),t.push(String.fromCharCode(240+(i>>18&7))),t.push(String.fromCharCode(144+(i>>12&63))),t.push(String.fromCharCode(128+(i>>6&63))),t.push(String.fromCharCode(128+(i&63)));break;default:t.push(String.fromCharCode(224+(r>>12))),t.push(String.fromCharCode(128+(r>>6&63))),t.push(String.fromCharCode(128+(r&63)))}return t.join(``)},Un=(function(){var e=[[`nbsp`,` `],[`middot`,`·`],[`quot`,`"`],[`apos`,`'`],[`gt`,`>`],[`lt`,`<`],[`amp`,`&`]].map(function(e){return[RegExp(`&`+e[0]+`;`,`ig`),e[1]]});return function(t){for(var n=t.replace(/^[\t\n\r ]+/,``).replace(/(^|[^\t\n\r ])[\t\n\r ]+$/,`$1`).replace(/>\s+/g,`>`).replace(/\b\s+</g,`<`).replace(/[\t\n\r ]+/g,` `).replace(/<\s*[bB][rR]\s*\/?>/g,`
`).replace(/<[^<>]*>/g,``),r=0;r<e.length;++r)n=n.replace(e[r][0],e[r][1]);return n}})(),Wn=/<\/?(?:vt:)?variant>/g,Gn=/<(?:vt:)([^<"'>]*)>([\s\S]*)</;function Kn(e,t){var n=q(e),r=on(e,n.baseType)||[],i=[];if(r.length!=n.size){if(t.WTF)throw Error(`unexpected vector length `+r.length+` != `+n.size);return i}return r.forEach(function(e){var t=e.replace(Wn,``).match(Gn);t&&i.push({v:Vn(t[2]),t:t[1]})}),i}var qn=/(^\s|\s$|\n)/;function Jn(e){return Et(e).map(function(t){return` `+t+`="`+e[t]+`"`}).join(``)}function Yn(e,t,n){return`<`+e+(n==null?``:Jn(n))+(t==null?`/`:(t.match(qn)?` xml:space="preserve"`:``)+`>`+t+`</`+e)+`>`}function Xn(e){if(U&&Buffer.isBuffer(e))return e.toString(`utf8`);if(typeof e==`string`)return e;if(typeof Uint8Array<`u`&&e instanceof Uint8Array)return Vn(ce(le(e)));throw Error(`Bad input format: expected Buffer or string`)}var Zn=/<([\/]?)([^\s?><!\/:"]*:|)([^\s?<>:\/"]+)(?:\s+[^<>=?"'\s]+="[^"]*?")*\s*[\/]?>/gm,Qn={CORE_PROPS:`http://schemas.openxmlformats.org/package/2006/metadata/core-properties`,CUST_PROPS:`http://schemas.openxmlformats.org/officeDocument/2006/custom-properties`,EXT_PROPS:`http://schemas.openxmlformats.org/officeDocument/2006/extended-properties`,CT:`http://schemas.openxmlformats.org/package/2006/content-types`,RELS:`http://schemas.openxmlformats.org/package/2006/relationships`,TCMNT:`http://schemas.microsoft.com/office/spreadsheetml/2018/threadedcomments`,dc:`http://purl.org/dc/elements/1.1/`,dcterms:`http://purl.org/dc/terms/`,dcmitype:`http://purl.org/dc/dcmitype/`,mx:`http://schemas.microsoft.com/office/mac/excel/2008/main`,r:`http://schemas.openxmlformats.org/officeDocument/2006/relationships`,sjs:`http://schemas.openxmlformats.org/package/2006/sheetjs/core-properties`,vt:`http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes`,xsi:`http://www.w3.org/2001/XMLSchema-instance`,xsd:`http://www.w3.org/2001/XMLSchema`},$n=[`http://schemas.openxmlformats.org/spreadsheetml/2006/main`,`http://purl.oclc.org/ooxml/spreadsheetml/main`,`http://schemas.microsoft.com/office/excel/2006/main`,`http://schemas.microsoft.com/office/excel/2006/2`];function er(e,t){for(var n=1-2*(e[t+7]>>>7),r=((e[t+7]&127)<<4)+(e[t+6]>>>4&15),i=e[t+6]&15,a=5;a>=0;--a)i=i*256+e[t+a];return r==2047?i==0?n*(1/0):NaN:(r==0?r=-1022:(r-=1023,i+=2**52),n*2**(r-52)*i)}function tr(e,t,n){var r=(t<0||1/t==-1/0)<<7,i=0,a=0,o=r?-t:t;isFinite(o)?o==0?i=a=0:(i=Math.floor(Math.log(o)/Math.LN2),a=o*2**(52-i),i<=-1023&&(!isFinite(a)||a<2**52)?i=-1022:(a-=2**52,i+=1023)):(i=2047,a=isNaN(t)?26985:0);for(var s=0;s<=5;++s,a/=256)e[n+s]=a&255;e[n+6]=(i&15)<<4|a&15,e[n+7]=i>>4|r}var nr=function(e){for(var t=[],n=10240,r=0;r<e[0].length;++r)if(e[0][r])for(var i=0,a=e[0][r].length;i<a;i+=n)t.push.apply(t,e[0][r].slice(i,i+n));return t},rr=U?function(e){return e[0].length>0&&Buffer.isBuffer(e[0][0])?Buffer.concat(e[0].map(function(e){return Buffer.isBuffer(e)?e:ie(e)})):nr(e)}:nr,ir=function(e,t,n){for(var r=[],i=t;i<n;i+=2)r.push(String.fromCharCode(Tr(e,i)));return r.join(``).replace(fe,``)},ar=U?function(e,t,n){return!Buffer.isBuffer(e)||!ae?ir(e,t,n):e.toString(`utf16le`,t,n).replace(fe,``)}:ir,or=function(e,t,n){for(var r=[],i=t;i<t+n;++i)r.push((`0`+e[i].toString(16)).slice(-2));return r.join(``)},sr=U?function(e,t,n){return Buffer.isBuffer(e)?e.toString(`hex`,t,t+n):or(e,t,n)}:or,cr=function(e,t,n){for(var r=[],i=t;i<n;i++)r.push(String.fromCharCode(wr(e,i)));return r.join(``)},lr=U?function(e,t,n){return Buffer.isBuffer(e)?e.toString(`utf8`,t,n):cr(e,t,n)}:cr,ur=function(e,t){var n=Dr(e,t);return n>0?lr(e,t+4,t+4+n-1):``},dr=ur,fr=function(e,t){var n=Dr(e,t);return n>0?lr(e,t+4,t+4+n-1):``},pr=fr,mr=function(e,t){var n=2*Dr(e,t);return n>0?lr(e,t+4,t+4+n-1):``},hr=mr,gr=function(e,t){var n=Dr(e,t);return n>0?ar(e,t+4,t+4+n):``},_r=gr,vr=function(e,t){var n=Dr(e,t);return n>0?lr(e,t+4,t+4+n):``},yr=vr,br=function(e,t){return er(e,t)},xr=br,Sr=function(e){return Array.isArray(e)||typeof Uint8Array<`u`&&e instanceof Uint8Array};U&&(dr=function(e,t){if(!Buffer.isBuffer(e))return ur(e,t);var n=e.readUInt32LE(t);return n>0?e.toString(`utf8`,t+4,t+4+n-1):``},pr=function(e,t){if(!Buffer.isBuffer(e))return fr(e,t);var n=e.readUInt32LE(t);return n>0?e.toString(`utf8`,t+4,t+4+n-1):``},hr=function(e,t){if(!Buffer.isBuffer(e)||!ae)return mr(e,t);var n=2*e.readUInt32LE(t);return e.toString(`utf16le`,t+4,t+4+n-1)},_r=function(e,t){if(!Buffer.isBuffer(e)||!ae)return gr(e,t);var n=e.readUInt32LE(t);return e.toString(`utf16le`,t+4,t+4+n)},yr=function(e,t){if(!Buffer.isBuffer(e))return vr(e,t);var n=e.readUInt32LE(t);return e.toString(`utf8`,t+4,t+4+n)},xr=function(e,t){return Buffer.isBuffer(e)?e.readDoubleLE(t):br(e,t)},Sr=function(e){return Buffer.isBuffer(e)||Array.isArray(e)||typeof Uint8Array<`u`&&e instanceof Uint8Array});function Cr(){ar=function(e,t,n){return O.utils.decode(1200,e.slice(t,n)).replace(fe,``)},lr=function(e,t,n){return O.utils.decode(65001,e.slice(t,n))},dr=function(e,t){var n=Dr(e,t);return n>0?O.utils.decode(D,e.slice(t+4,t+4+n-1)):``},pr=function(e,t){var n=Dr(e,t);return n>0?O.utils.decode(E,e.slice(t+4,t+4+n-1)):``},hr=function(e,t){var n=2*Dr(e,t);return n>0?O.utils.decode(1200,e.slice(t+4,t+4+n-1)):``},_r=function(e,t){var n=Dr(e,t);return n>0?O.utils.decode(1200,e.slice(t+4,t+4+n)):``},yr=function(e,t){var n=Dr(e,t);return n>0?O.utils.decode(65001,e.slice(t+4,t+4+n)):``}}O!==void 0&&Cr();var wr=function(e,t){return e[t]},Tr=function(e,t){return e[t+1]*256+e[t]},Er=function(e,t){var n=e[t+1]*256+e[t];return n<32768?n:(65535-n+1)*-1},Dr=function(e,t){return e[t+3]*(1<<24)+(e[t+2]<<16)+(e[t+1]<<8)+e[t]},Or=function(e,t){return e[t+3]<<24|e[t+2]<<16|e[t+1]<<8|e[t]},kr=function(e,t){return e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3]};function Ar(e,t){var n=``,r,i,a=[],o,s,c,l;switch(t){case`dbcs`:if(l=this.l,U&&Buffer.isBuffer(this)&&ae)n=this.slice(this.l,this.l+2*e).toString(`utf16le`);else for(c=0;c<e;++c)n+=String.fromCharCode(Tr(this,l)),l+=2;e*=2;break;case`utf8`:n=lr(this,this.l,this.l+e);break;case`utf16le`:e*=2,n=ar(this,this.l,this.l+e);break;case`wstr`:if(O!==void 0)n=O.utils.decode(E,this.slice(this.l,this.l+2*e));else return Ar.call(this,e,`dbcs`);e=2*e;break;case`lpstr-ansi`:n=dr(this,this.l),e=4+Dr(this,this.l);break;case`lpstr-cp`:n=pr(this,this.l),e=4+Dr(this,this.l);break;case`lpwstr`:n=hr(this,this.l),e=4+2*Dr(this,this.l);break;case`lpp4`:e=4+Dr(this,this.l),n=_r(this,this.l),e&2&&(e+=2);break;case`8lpp4`:e=4+Dr(this,this.l),n=yr(this,this.l),e&3&&(e+=4-(e&3));break;case`cstr`:for(e=0,n=``;(o=wr(this,this.l+e++))!==0;)a.push(L(o));n=a.join(``);break;case`_wstr`:for(e=0,n=``;(o=Tr(this,this.l+e))!==0;)a.push(L(o)),e+=2;e+=2,n=a.join(``);break;case`dbcs-cont`:for(n=``,l=this.l,c=0;c<e;++c){if(this.lens&&this.lens.indexOf(l)!==-1)return o=wr(this,l),this.l=l+1,s=Ar.call(this,e-c,o?`dbcs-cont`:`sbcs-cont`),a.join(``)+s;a.push(L(Tr(this,l))),l+=2}n=a.join(``),e*=2;break;case`cpstr`:if(O!==void 0){n=O.utils.decode(E,this.slice(this.l,this.l+e));break}case`sbcs-cont`:for(n=``,l=this.l,c=0;c!=e;++c){if(this.lens&&this.lens.indexOf(l)!==-1)return o=wr(this,l),this.l=l+1,s=Ar.call(this,e-c,o?`dbcs-cont`:`sbcs-cont`),a.join(``)+s;a.push(L(wr(this,l))),l+=1}n=a.join(``);break;default:switch(e){case 1:return r=wr(this,this.l),this.l++,r;case 2:return r=(t===`i`?Er:Tr)(this,this.l),this.l+=2,r;case 4:case-4:return t===`i`||!(this[this.l+3]&128)?(r=(e>0?Or:kr)(this,this.l),this.l+=4,r):(i=Dr(this,this.l),this.l+=4,i);case 8:case-8:if(t===`f`)return i=e==8?xr(this,this.l):xr([this[this.l+7],this[this.l+6],this[this.l+5],this[this.l+4],this[this.l+3],this[this.l+2],this[this.l+1],this[this.l+0]],0),this.l+=8,i;e=8;case 16:n=sr(this,this.l,e);break}}return this.l+=e,n}var jr=function(e,t,n){e[n]=t&255,e[n+1]=t>>>8&255,e[n+2]=t>>>16&255,e[n+3]=t>>>24&255},Mr=function(e,t,n){e[n]=t&255,e[n+1]=t>>8&255,e[n+2]=t>>16&255,e[n+3]=t>>24&255},Nr=function(e,t,n){e[n]=t&255,e[n+1]=t>>>8&255};function Pr(e,t,n){var r=0,i=0;if(n===`dbcs`){for(i=0;i!=t.length;++i)Nr(this,t.charCodeAt(i),this.l+2*i);r=2*t.length}else if(n===`sbcs`||n==`cpstr`)if(O!==void 0&&D==874){for(i=0;i!=t.length;++i){var a=O.utils.encode(D,t.charAt(i));this[this.l+i]=a[0]}r=t.length}else if(O!==void 0&&n==`cpstr`){if(a=O.utils.encode(E,t),a.length==t.length)for(i=0;i<t.length;++i)a[i]==0&&t.charCodeAt(i)!=0&&(a[i]=95);if(a.length==2*t.length)for(i=0;i<t.length;++i)a[2*i]==0&&a[2*i+1]==0&&t.charCodeAt(i)!=0&&(a[2*i]=95);for(i=0;i<a.length;++i)this[this.l+i]=a[i];r=a.length}else{for(t=t.replace(/[^\x00-\x7F]/g,`_`),i=0;i!=t.length;++i)this[this.l+i]=t.charCodeAt(i)&255;r=t.length}else if(n===`hex`){for(;i<e;++i)this[this.l++]=parseInt(t.slice(2*i,2*i+2),16)||0;return this}else if(n===`utf16le`){var o=Math.min(this.l+e,this.length);for(i=0;i<Math.min(t.length,e);++i){var s=t.charCodeAt(i);this[this.l++]=s&255,this[this.l++]=s>>8}for(;this.l<o;)this[this.l++]=0;return this}else switch(e){case 1:r=1,this[this.l]=t&255;break;case 2:r=2,this[this.l]=t&255,t>>>=8,this[this.l+1]=t&255;break;case 3:r=3,this[this.l]=t&255,t>>>=8,this[this.l+1]=t&255,t>>>=8,this[this.l+2]=t&255;break;case 4:r=4,jr(this,t,this.l);break;case 8:if(r=8,n===`f`){tr(this,t,this.l);break}case 16:break;case-4:r=4,Mr(this,t,this.l);break}return this.l+=r,this}function Fr(e,t){var n=sr(this,this.l,e.length>>1);if(n!==e)throw Error(t+`Expected `+e+` saw `+n);this.l+=e.length>>1}function Ir(e,t){e.l=t,e.read_shift=Ar,e.chk=Fr,e.write_shift=Pr}function Lr(e,t){e.l+=t}function Rr(e){var t=oe(e);return Ir(t,0),t}function zr(e,t,n){if(e){var r,i,a;Ir(e,e.l||0);for(var o=e.length,s=0,c=0;e.l<o;){s=e.read_shift(1),s&128&&(s=(s&127)+((e.read_shift(1)&127)<<7));var l=Lp[s]||Lp[65535];for(r=e.read_shift(1),a=r&127,i=1;i<4&&r&128;++i)a+=((r=e.read_shift(1))&127)<<7*i;c=e.l+a;var u=l.f&&l.f(e,a,n);if(e.l=c,t(u,l,s))return}}}function Br(){var e=[],t=U?16384:2048;U&&Rr(t).copy;var n=function(e){var t=Rr(e);return Ir(t,0),t},r=n(t),i=function(){r&&=(r.l&&(r.length>r.l&&(r=r.slice(0,r.l),r.l=r.length),r.length>0&&e.push(r)),null)},a=function(e){return r&&e<r.length-r.l?r:(i(),r=n(Math.max(e+1,t)))};return{next:a,push:function(e){i(),r=e,r.l??=r.length,a(t)},end:function(){return i(),ue(e)},_bufs:e,end2:function(){return i(),e}}}function Vr(e,t,n){var r=zt(e);if(t.s?(r.cRel&&(r.c+=t.s.c),r.rRel&&(r.r+=t.s.r)):(r.cRel&&(r.c+=t.c),r.rRel&&(r.r+=t.r)),!n||n.biff<12){for(;r.c>=256;)r.c-=256;for(;r.r>=65536;)r.r-=65536}return r}function Hr(e,t,n){var r=zt(e);return r.s=Vr(r.s,t.s,n),r.e=Vr(r.e,t.s,n),r}function Ur(e,t){if(e.cRel&&e.c<0)for(e=zt(e);e.c<0;)e.c+=t>8?16384:256;if(e.rRel&&e.r<0)for(e=zt(e);e.r<0;)e.r+=t>8?1048576:t>5?65536:16384;var n=ti(e);return!e.cRel&&e.cRel!=null&&(n=Zr(n)),!e.rRel&&e.rRel!=null&&(n=qr(n)),n}function Wr(e,t){return e.s.r==0&&!e.s.rRel&&e.e.r==(t.biff>=12?1048575:t.biff>=8?65536:16384)&&!e.e.rRel?(e.s.cRel?``:`$`)+Xr(e.s.c)+`:`+(e.e.cRel?``:`$`)+Xr(e.e.c):e.s.c==0&&!e.s.cRel&&e.e.c==(t.biff>=12?16383:255)&&!e.e.cRel?(e.s.rRel?``:`$`)+Kr(e.s.r)+`:`+(e.e.rRel?``:`$`)+Kr(e.e.r):Ur(e.s,t.biff)+`:`+Ur(e.e,t.biff)}function Gr(e){return parseInt(Jr(e),10)-1}function Kr(e){return``+(e+1)}function qr(e){return e.replace(/([A-Z]|^)(\d+)$/,`$1$$$2`)}function Jr(e){return e.replace(/\$(\d+)$/,`$1`)}function Yr(e){for(var t=Qr(e),n=0,r=0;r!==t.length;++r)n=26*n+t.charCodeAt(r)-64;return n-1}function Xr(e){if(e<0)throw Error(`invalid column `+e);var t=``;for(++e;e;e=Math.floor((e-1)/26))t=String.fromCharCode((e-1)%26+65)+t;return t}function Zr(e){return e.replace(/^([A-Z])/,`$$$1`)}function Qr(e){return e.replace(/^\$([A-Z])/,`$1`)}function $r(e){return e.replace(/(\$?[A-Z]*)(\$?\d*)/,`$1,$2`).split(`,`)}function ei(e){for(var t=0,n=0,r=0;r<e.length;++r){var i=e.charCodeAt(r);i>=48&&i<=57?t=10*t+(i-48):i>=65&&i<=90&&(n=26*n+(i-64))}return{c:n-1,r:t-1}}function ti(e){for(var t=e.c+1,n=``;t;t=(t-1)/26|0)n=String.fromCharCode((t-1)%26+65)+n;return n+(e.r+1)}function ni(e){var t=e.indexOf(`:`);return t==-1?{s:ei(e),e:ei(e)}:{s:ei(e.slice(0,t)),e:ei(e.slice(t+1))}}function ri(e,t){return t===void 0||typeof t==`number`?ri(e.s,e.e):(typeof e!=`string`&&(e=ti(e)),typeof t!=`string`&&(t=ti(t)),e==t?e:e+`:`+t)}function ii(e,t){if(!e&&!(t&&t.biff<=5&&t.biff>=2))throw Error(`empty sheet name`);return/[^\w\u4E00-\u9FFF\u3040-\u30FF]/.test(e)?`'`+e.replace(/'/g,`''`)+`'`:e}function ai(e){var t={s:{c:0,r:0},e:{c:0,r:0}},n=0,r=0,i=0,a=e.length;for(n=0;r<a&&!((i=e.charCodeAt(r)-64)<1||i>26);++r)n=26*n+i;for(t.s.c=--n,n=0;r<a&&!((i=e.charCodeAt(r)-48)<0||i>9);++r)n=10*n+i;if(t.s.r=--n,r===a||i!=10)return t.e.c=t.s.c,t.e.r=t.s.r,t;for(++r,n=0;r!=a&&!((i=e.charCodeAt(r)-64)<1||i>26);++r)n=26*n+i;for(t.e.c=--n,n=0;r!=a&&!((i=e.charCodeAt(r)-48)<0||i>9);++r)n=10*n+i;return t.e.r=--n,t}function oi(e,t){var n=e.t==`d`&&t instanceof Date;if(e.z!=null)try{return e.w=mt(e.z,n?jt(t):t)}catch{}try{return e.w=mt((e.XF||{}).numFmtId||(n?14:0),n?jt(t):t)}catch{return``+t}}function si(e,t,n){return e==null||e.t==null||e.t==`z`?``:e.w===void 0?(e.t==`d`&&!e.z&&n&&n.dateNF&&(e.z=n.dateNF),e.t==`e`?Xi[e.v]||e.v:t==null?oi(e,e.v):oi(e,t)):e.w}function ci(e,t){var n=t&&t.sheet?t.sheet:`Sheet1`,r={};return r[n]=e,{SheetNames:[n],Sheets:r}}function li(e){var t={};return(e||{}).dense&&(t[`!data`]=[]),t}function ui(e,t,n){var r=n||{},i=e?e[`!data`]!=null:r.dense;z!=null&&i==null&&(i=z);var a=e||(i?{"!data":[]}:{});i&&!a[`!data`]&&(a[`!data`]=[]);var o=0,s=0;if(a&&r.origin!=null)if(typeof r.origin==`number`)o=r.origin;else{var c=typeof r.origin==`string`?ei(r.origin):r.origin;o=c.r,s=c.c}var l={s:{c:1e7,r:1e7},e:{c:0,r:0}};if(a[`!ref`]){var u=ai(a[`!ref`]);l.s.c=u.s.c,l.s.r=u.s.r,l.e.c=Math.max(l.e.c,u.e.c),l.e.r=Math.max(l.e.r,u.e.r),o==-1&&(l.e.r=o=a[`!ref`]?u.e.r+1:0)}else l.s.c=l.e.c=l.s.r=l.e.r=0;for(var d=[],f=!1,p=0;p!=t.length;++p)if(t[p]){if(!Array.isArray(t[p]))throw Error(`aoa_to_sheet expects an array of arrays`);var m=o+p;i&&(a[`!data`][m]||(a[`!data`][m]=[]),d=a[`!data`][m]);for(var h=t[p],g=0;g!=h.length;++g)if(h[g]!==void 0){var _={v:h[g],t:``},v=s+g;if(l.s.r>m&&(l.s.r=m),l.s.c>v&&(l.s.c=v),l.e.r<m&&(l.e.r=m),l.e.c<v&&(l.e.c=v),f=!0,h[g]&&typeof h[g]==`object`&&!Array.isArray(h[g])&&!(h[g]instanceof Date))_=h[g];else if(Array.isArray(_.v)&&(_.f=h[g][1],_.v=_.v[0]),_.v===null)if(_.f)_.t=`n`;else if(r.nullError)_.t=`e`,_.v=0;else if(r.sheetStubs)_.t=`z`;else continue;else typeof _.v==`number`?isFinite(_.v)?_.t=`n`:isNaN(_.v)?(_.t=`e`,_.v=15):(_.t=`e`,_.v=7):typeof _.v==`boolean`?_.t=`b`:_.v instanceof Date?(_.z=r.dateNF||G[14],r.UTC||(_.v=Qt(_.v)),r.cellDates?(_.t=`d`,_.w=mt(_.z,jt(_.v,r.date1904))):(_.t=`n`,_.v=jt(_.v,r.date1904),_.w=mt(_.z,_.v))):_.t=`s`;if(i)d[v]&&d[v].z&&(_.z=d[v].z),d[v]=_;else{var y=Xr(v)+(m+1);a[y]&&a[y].z&&(_.z=a[y].z),a[y]=_}}}return f&&l.s.c<104e5&&(a[`!ref`]=ri(l)),a}function di(e,t){return ui(null,e,t)}function fi(e){return e.read_shift(4,`i`)}function pi(e){var t=e.read_shift(4);return t===0?``:e.read_shift(t,`dbcs`)}function mi(e){return{ich:e.read_shift(2),ifnt:e.read_shift(2)}}function hi(e,t){var n=e.l,r=e.read_shift(1),i=pi(e),a=[],o={t:i,h:i};if(r&1){for(var s=e.read_shift(4),c=0;c!=s;++c)a.push(mi(e));o.r=a}else o.r=[{ich:0,ifnt:0}];return e.l=n+t,o}var gi=hi;function _i(e){var t=e.read_shift(4),n=e.read_shift(2);return n+=e.read_shift(1)<<16,e.l++,{c:t,iStyleRef:n}}function vi(e){var t=e.read_shift(2);return t+=e.read_shift(1)<<16,e.l++,{c:-1,iStyleRef:t}}var yi=pi;function bi(e){var t=e.read_shift(4);return t===0||t===4294967295?``:e.read_shift(t,`dbcs`)}var xi=pi,Si=bi;function Ci(e){var t=e.slice(e.l,e.l+4),n=t[0]&1,r=t[0]&2;e.l+=4;var i=r===0?xr([0,0,0,0,t[0]&252,t[1],t[2],t[3]],0):Or(t,0)>>2;return n?i/100:i}function wi(e){var t={s:{},e:{}};return t.s.r=e.read_shift(4),t.e.r=e.read_shift(4),t.s.c=e.read_shift(4),t.e.c=e.read_shift(4),t}var Ti=wi;function J(e){if(e.length-e.l<8)throw`XLS Xnum Buffer underflow`;return e.read_shift(8,`f`)}function Ei(e){var t={},n=e.read_shift(1)>>>1,r=e.read_shift(1),i=e.read_shift(2,`i`),a=e.read_shift(1),o=e.read_shift(1),s=e.read_shift(1);switch(e.l++,n){case 0:t.auto=1;break;case 1:t.index=r;var c=Yi[r];c&&(t.rgb=bc(c));break;case 2:t.rgb=bc([a,o,s]);break;case 3:t.theme=r;break}return i!=0&&(t.tint=i>0?i/32767:i/32768),t}function Di(e){var t=e.read_shift(1);return e.l++,{fBold:t&1,fItalic:t&2,fUnderline:t&4,fStrikeout:t&8,fOutline:t&16,fShadow:t&32,fCondense:t&64,fExtend:t&128}}function Oi(e,t){var n={2:`BITMAP`,3:`METAFILEPICT`,8:`DIB`,14:`ENHMETAFILE`},r=e.read_shift(4);switch(r){case 0:return``;case 4294967295:case 4294967294:return n[e.read_shift(4)]||``}if(r>400)throw Error(`Unsupported Clipboard: `+r.toString(16));return e.l-=4,e.read_shift(0,t==1?`lpstr`:`lpwstr`)}function ki(e){return Oi(e,1)}function Ai(e){return Oi(e,2)}var ji=2,Mi=3,Ni=11,Pi=12,Fi=19,Ii=64,Li=65,Ri=71,zi=4108,Bi=4126,Vi=80,Hi=81,Ui=[Vi,Hi],Wi={1:{n:`CodePage`,t:ji},2:{n:`Category`,t:Vi},3:{n:`PresentationFormat`,t:Vi},4:{n:`ByteCount`,t:Mi},5:{n:`LineCount`,t:Mi},6:{n:`ParagraphCount`,t:Mi},7:{n:`SlideCount`,t:Mi},8:{n:`NoteCount`,t:Mi},9:{n:`HiddenCount`,t:Mi},10:{n:`MultimediaClipCount`,t:Mi},11:{n:`ScaleCrop`,t:Ni},12:{n:`HeadingPairs`,t:zi},13:{n:`TitlesOfParts`,t:Bi},14:{n:`Manager`,t:Vi},15:{n:`Company`,t:Vi},16:{n:`LinksUpToDate`,t:Ni},17:{n:`CharacterCount`,t:Mi},19:{n:`SharedDoc`,t:Ni},22:{n:`HyperlinksChanged`,t:Ni},23:{n:`AppVersion`,t:Mi,p:`version`},24:{n:`DigSig`,t:Li},26:{n:`ContentType`,t:Vi},27:{n:`ContentStatus`,t:Vi},28:{n:`Language`,t:Vi},29:{n:`Version`,t:Vi},255:{},2147483648:{n:`Locale`,t:Fi},2147483651:{n:`Behavior`,t:Fi},1919054434:{}},Gi={1:{n:`CodePage`,t:ji},2:{n:`Title`,t:Vi},3:{n:`Subject`,t:Vi},4:{n:`Author`,t:Vi},5:{n:`Keywords`,t:Vi},6:{n:`Comments`,t:Vi},7:{n:`Template`,t:Vi},8:{n:`LastAuthor`,t:Vi},9:{n:`RevNumber`,t:Vi},10:{n:`EditTime`,t:Ii},11:{n:`LastPrinted`,t:Ii},12:{n:`CreatedDate`,t:Ii},13:{n:`ModifiedDate`,t:Ii},14:{n:`PageCount`,t:Mi},15:{n:`WordCount`,t:Mi},16:{n:`CharCount`,t:Mi},17:{n:`Thumbnail`,t:Ri},18:{n:`Application`,t:Vi},19:{n:`DocSecurity`,t:Mi},255:{},2147483648:{n:`Locale`,t:Fi},2147483651:{n:`Behavior`,t:Fi},1919054434:{}},Ki={1:`US`,2:`CA`,3:``,7:`RU`,20:`EG`,30:`GR`,31:`NL`,32:`BE`,33:`FR`,34:`ES`,36:`HU`,39:`IT`,41:`CH`,43:`AT`,44:`GB`,45:`DK`,46:`SE`,47:`NO`,48:`PL`,49:`DE`,52:`MX`,55:`BR`,61:`AU`,64:`NZ`,66:`TH`,81:`JP`,82:`KR`,84:`VN`,86:`CN`,90:`TR`,105:`JS`,213:`DZ`,216:`MA`,218:`LY`,351:`PT`,354:`IS`,358:`FI`,420:`CZ`,886:`TW`,961:`LB`,962:`JO`,963:`SY`,964:`IQ`,965:`KW`,966:`SA`,971:`AE`,972:`IL`,974:`QA`,981:`IR`,65535:`US`},qi=[null,`solid`,`mediumGray`,`darkGray`,`lightGray`,`darkHorizontal`,`darkVertical`,`darkDown`,`darkUp`,`darkGrid`,`darkTrellis`,`lightHorizontal`,`lightVertical`,`lightDown`,`lightUp`,`lightGrid`,`lightTrellis`,`gray125`,`gray0625`];function Ji(e){return e.map(function(e){return[e>>16&255,e>>8&255,e&255]})}var Yi=zt(Ji([0,16777215,16711680,65280,255,16776960,16711935,65535,0,16777215,16711680,65280,255,16776960,16711935,65535,8388608,32768,128,8421376,8388736,32896,12632256,8421504,10066431,10040166,16777164,13434879,6684774,16744576,26316,13421823,128,16711935,16776960,65535,8388736,8388608,32896,255,52479,13434879,13434828,16777113,10079487,16751052,13408767,16764057,3368703,3394764,10079232,16763904,16750848,16737792,6710937,9868950,13158,3381606,13056,3355392,10040064,10040166,3355545,3355443,0,16777215,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),Xi={0:`#NULL!`,7:`#DIV/0!`,15:`#VALUE!`,23:`#REF!`,29:`#NAME?`,36:`#NUM!`,42:`#N/A`,43:`#GETTING_DATA`,255:`#WTF?`},Zi={"#NULL!":0,"#DIV/0!":7,"#VALUE!":15,"#REF!":23,"#NAME?":29,"#NUM!":36,"#N/A":42,"#GETTING_DATA":43,"#WTF?":255},Qi=[`_xlnm.Consolidate_Area`,`_xlnm.Auto_Open`,`_xlnm.Auto_Close`,`_xlnm.Extract`,`_xlnm.Database`,`_xlnm.Criteria`,`_xlnm.Print_Area`,`_xlnm.Print_Titles`,`_xlnm.Recorder`,`_xlnm.Data_Form`,`_xlnm.Auto_Activate`,`_xlnm.Auto_Deactivate`,`_xlnm.Sheet_Title`,`_xlnm._FilterDatabase`],$i={"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml":`workbooks`,"application/vnd.ms-excel.sheet.macroEnabled.main+xml":`workbooks`,"application/vnd.ms-excel.sheet.binary.macroEnabled.main":`workbooks`,"application/vnd.ms-excel.addin.macroEnabled.main+xml":`workbooks`,"application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml":`workbooks`,"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml":`sheets`,"application/vnd.ms-excel.worksheet":`sheets`,"application/vnd.ms-excel.binIndexWs":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml":`charts`,"application/vnd.ms-excel.chartsheet":`charts`,"application/vnd.ms-excel.macrosheet+xml":`macros`,"application/vnd.ms-excel.macrosheet":`macros`,"application/vnd.ms-excel.intlmacrosheet":`TODO`,"application/vnd.ms-excel.binIndexMs":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml":`dialogs`,"application/vnd.ms-excel.dialogsheet":`dialogs`,"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml":`strs`,"application/vnd.ms-excel.sharedStrings":`strs`,"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml":`styles`,"application/vnd.ms-excel.styles":`styles`,"application/vnd.openxmlformats-package.core-properties+xml":`coreprops`,"application/vnd.openxmlformats-officedocument.custom-properties+xml":`custprops`,"application/vnd.openxmlformats-officedocument.extended-properties+xml":`extprops`,"application/vnd.openxmlformats-officedocument.customXmlProperties+xml":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.customProperty":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml":`comments`,"application/vnd.ms-excel.comments":`comments`,"application/vnd.ms-excel.threadedcomments+xml":`threadedcomments`,"application/vnd.ms-excel.person+xml":`people`,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml":`metadata`,"application/vnd.ms-excel.sheetMetadata":`metadata`,"application/vnd.ms-excel.pivotTable":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml":`TODO`,"application/vnd.openxmlformats-officedocument.drawingml.chart+xml":`TODO`,"application/vnd.ms-office.chartcolorstyle+xml":`TODO`,"application/vnd.ms-office.chartstyle+xml":`TODO`,"application/vnd.ms-office.chartex+xml":`TODO`,"application/vnd.ms-excel.calcChain":`calcchains`,"application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml":`calcchains`,"application/vnd.openxmlformats-officedocument.spreadsheetml.printerSettings":`TODO`,"application/vnd.ms-office.activeX":`TODO`,"application/vnd.ms-office.activeX+xml":`TODO`,"application/vnd.ms-excel.attachedToolbars":`TODO`,"application/vnd.ms-excel.connections":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml":`TODO`,"application/vnd.ms-excel.externalLink":`links`,"application/vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml":`links`,"application/vnd.ms-excel.pivotCacheDefinition":`TODO`,"application/vnd.ms-excel.pivotCacheRecords":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml":`TODO`,"application/vnd.ms-excel.queryTable":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.queryTable+xml":`TODO`,"application/vnd.ms-excel.userNames":`TODO`,"application/vnd.ms-excel.revisionHeaders":`TODO`,"application/vnd.ms-excel.revisionLog":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionHeaders+xml":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionLog+xml":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.userNames+xml":`TODO`,"application/vnd.ms-excel.tableSingleCells":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.tableSingleCells+xml":`TODO`,"application/vnd.ms-excel.slicer":`TODO`,"application/vnd.ms-excel.slicerCache":`TODO`,"application/vnd.ms-excel.slicer+xml":`TODO`,"application/vnd.ms-excel.slicerCache+xml":`TODO`,"application/vnd.ms-excel.wsSortMap":`TODO`,"application/vnd.ms-excel.table":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml":`TODO`,"application/vnd.openxmlformats-officedocument.theme+xml":`themes`,"application/vnd.openxmlformats-officedocument.themeOverride+xml":`TODO`,"application/vnd.ms-excel.Timeline+xml":`TODO`,"application/vnd.ms-excel.TimelineCache+xml":`TODO`,"application/vnd.ms-office.vbaProject":`vba`,"application/vnd.ms-office.vbaProjectSignature":`TODO`,"application/vnd.ms-office.volatileDependencies":`TODO`,"application/vnd.openxmlformats-officedocument.spreadsheetml.volatileDependencies+xml":`TODO`,"application/vnd.ms-excel.controlproperties+xml":`TODO`,"application/vnd.openxmlformats-officedocument.model+data":`TODO`,"application/vnd.ms-excel.Survey+xml":`TODO`,"application/vnd.openxmlformats-officedocument.drawing+xml":`drawings`,"application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml":`TODO`,"application/vnd.openxmlformats-officedocument.drawingml.diagramColors+xml":`TODO`,"application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml":`TODO`,"application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml":`TODO`,"application/vnd.openxmlformats-officedocument.drawingml.diagramStyle+xml":`TODO`,"application/vnd.openxmlformats-officedocument.vmlDrawing":`TODO`,"application/vnd.openxmlformats-package.relationships+xml":`rels`,"application/vnd.openxmlformats-officedocument.oleObject":`TODO`,"image/png":`TODO`,sheet:`js`};function ea(){return{workbooks:[],sheets:[],charts:[],dialogs:[],macros:[],rels:[],strs:[],comments:[],threadedcomments:[],links:[],coreprops:[],extprops:[],custprops:[],themes:[],styles:[],calcchains:[],vba:[],drawings:[],metadata:[],people:[],TODO:[],xmlns:``}}function ta(e){var t=ea();if(!e||!e.match)return t;var n={};if((e.match(wn)||[]).forEach(function(e){var r=q(e);switch(r[0].replace(Tn,`<`)){case`<?xml`:break;case`<Types`:t.xmlns=r[`xmlns`+(r[0].match(/<(\w+):/)||[``,``])[1]];break;case`<Default`:n[r.Extension.toLowerCase()]=r.ContentType;break;case`<Override`:t[$i[r.ContentType]]!==void 0&&t[$i[r.ContentType]].push(r.PartName);break}}),t.xmlns!==Qn.CT)throw Error(`Unknown Namespace: `+t.xmlns);return t.calcchain=t.calcchains.length>0?t.calcchains[0]:``,t.sst=t.strs.length>0?t.strs[0]:``,t.style=t.styles.length>0?t.styles[0]:``,t.defaults=n,delete t.calcchains,t}var na={WB:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument`,SHEET:`http://sheetjs.openxmlformats.org/officeDocument/2006/relationships/officeDocument`,HLINK:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink`,VML:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing`,XPATH:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLinkPath`,XMISS:`http://schemas.microsoft.com/office/2006/relationships/xlExternalLinkPath/xlPathMissing`,XLINK:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLink`,CXML:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml`,CXMLP:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps`,CMNT:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments`,CORE_PROPS:`http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties`,EXT_PROPS:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties`,CUST_PROPS:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties`,SST:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings`,STY:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles`,THEME:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme`,CHART:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart`,CHARTEX:`http://schemas.microsoft.com/office/2014/relationships/chartEx`,CS:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/chartsheet`,WS:[`http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet`,`http://purl.oclc.org/ooxml/officeDocument/relationships/worksheet`],DS:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/dialogsheet`,MS:`http://schemas.microsoft.com/office/2006/relationships/xlMacrosheet`,IMG:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/image`,DRAW:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing`,XLMETA:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/sheetMetadata`,TCMNT:`http://schemas.microsoft.com/office/2017/10/relationships/threadedComment`,PEOPLE:`http://schemas.microsoft.com/office/2017/10/relationships/person`,CONN:`http://schemas.openxmlformats.org/officeDocument/2006/relationships/connections`,VBA:`http://schemas.microsoft.com/office/2006/relationships/vbaProject`};function ra(e){var t=e.lastIndexOf(`/`);return e.slice(0,t+1)+`_rels/`+e.slice(t+1)+`.rels`}function ia(e,t){var n={"!id":{}};if(!e)return n;t.charAt(0)!==`/`&&(t=`/`+t);var r={};return(e.match(wn)||[]).forEach(function(e){var i=q(e);if(i[0]===`<Relationship`){var a={};a.Type=i.Type,a.Target=jn(i.Target),a.Id=i.Id,i.TargetMode&&(a.TargetMode=i.TargetMode);var o=i.TargetMode===`External`?i.Target:bn(i.Target,t);n[o]=a,r[i.Id]=a}}),n[`!id`]=r,n}var aa=`application/vnd.oasis.opendocument.spreadsheet`;function oa(e,t){for(var n=Xn(e),r,i;r=Zn.exec(n);)switch(r[3]){case`manifest`:break;case`file-entry`:if(i=q(r[0],!1),i.path==`/`&&i.type!==aa)throw Error(`This OpenDocument is not a spreadsheet`);break;case`encryption-data`:case`algorithm`:case`start-key-generation`:case`key-derivation`:throw Error(`Unsupported ODS Encryption`);default:if(t&&t.WTF)throw r}}var sa=[[`cp:category`,`Category`],[`cp:contentStatus`,`ContentStatus`],[`cp:keywords`,`Keywords`],[`cp:lastModifiedBy`,`LastAuthor`],[`cp:lastPrinted`,`LastPrinted`],[`cp:revision`,`RevNumber`],[`cp:version`,`Version`],[`dc:creator`,`Author`],[`dc:description`,`Comments`],[`dc:identifier`,`Identifier`],[`dc:language`,`Language`],[`dc:subject`,`Subject`],[`dc:title`,`Title`],[`dcterms:created`,`CreatedDate`,`date`],[`dcterms:modified`,`ModifiedDate`,`date`]];function ca(e){var t={};e=Vn(e);for(var n=0;n<sa.length;++n){var r=sa[n],i=rn(e,r[0]);i!=null&&i.length>0&&(t[r[1]]=jn(i[1])),r[2]===`date`&&t[r[1]]&&(t[r[1]]=Lt(t[r[1]]))}return t}var la=[[`Application`,`Application`,`string`],[`AppVersion`,`AppVersion`,`string`],[`Company`,`Company`,`string`],[`DocSecurity`,`DocSecurity`,`string`],[`Manager`,`Manager`,`string`],[`HyperlinksChanged`,`HyperlinksChanged`,`bool`],[`SharedDoc`,`SharedDoc`,`bool`],[`LinksUpToDate`,`LinksUpToDate`,`bool`],[`ScaleCrop`,`ScaleCrop`,`bool`],[`HeadingPairs`,`HeadingPairs`,`raw`],[`TitlesOfParts`,`TitlesOfParts`,`raw`]];function ua(e,t,n,r){var i=[];if(typeof e==`string`)i=Kn(e,r);else for(var a=0;a<e.length;++a)i=i.concat(e[a].map(function(e){return{v:e}}));var o=typeof t==`string`?Kn(t,r).map(function(e){return e.v}):t,s=0,c=0;if(o.length>0)for(var l=0;l!==i.length;l+=2){switch(c=+i[l+1].v,i[l].v){case`Worksheets`:case`工作表`:case`Листы`:case`أوراق العمل`:case`ワークシート`:case`גליונות עבודה`:case`Arbeitsblätter`:case`Çalışma Sayfaları`:case`Feuilles de calcul`:case`Fogli di lavoro`:case`Folhas de cálculo`:case`Planilhas`:case`Regneark`:case`Hojas de cálculo`:case`Werkbladen`:n.Worksheets=c,n.SheetNames=o.slice(s,s+c);break;case`Named Ranges`:case`Rangos con nombre`:case`名前付き一覧`:case`Benannte Bereiche`:case`Navngivne områder`:n.NamedRanges=c,n.DefinedNames=o.slice(s,s+c);break;case`Charts`:case`Diagramme`:n.Chartsheets=c,n.ChartNames=o.slice(s,s+c);break}s+=c}}function da(e,t,n){var r={};return t||={},e=Vn(e),la.forEach(function(n){var i=(an(e,n[0])||[])[1];switch(n[2]){case`string`:i&&(t[n[1]]=jn(i));break;case`bool`:t[n[1]]=i===`true`;break;case`raw`:var a=rn(e,n[0]);a&&a.length>0&&(r[n[1]]=a[1]);break}}),r.HeadingPairs&&r.TitlesOfParts&&ua(r.HeadingPairs,r.TitlesOfParts,t,n),t}var fa=/<[^<>]+>[^<]*/g;function pa(e,t){var n={},r=``,i=e.match(fa);if(i)for(var a=0;a!=i.length;++a){var o=i[a],s=q(o);switch(On(s[0])){case`<?xml`:break;case`<Properties`:break;case`<property`:r=jn(s.name);break;case`</property>`:r=null;break;default:if(o.indexOf(`<vt:`)===0){var c=o.split(`>`),l=c[0].slice(4),u=c[1];switch(l){case`lpstr`:case`bstr`:case`lpwstr`:n[r]=jn(u);break;case`bool`:n[r]=In(u);break;case`i1`:case`i2`:case`i4`:case`i8`:case`int`:case`uint`:n[r]=parseInt(u,10);break;case`r4`:case`r8`:case`decimal`:n[r]=parseFloat(u);break;case`filetime`:case`date`:n[r]=Lt(u);break;case`cy`:case`error`:n[r]=jn(u);break;default:if(l.slice(-1)==`/`)break;t.WTF&&typeof console<`u`&&console.warn(`Unexpected`,o,l,c)}}else if(o.slice(0,2)!==`</`&&t.WTF)throw Error(o)}}return n}var ma={Title:`Title`,Subject:`Subject`,Author:`Author`,Keywords:`Keywords`,Comments:`Description`,LastAuthor:`LastAuthor`,RevNumber:`Revision`,Application:`AppName`,LastPrinted:`LastPrinted`,CreatedDate:`Created`,ModifiedDate:`LastSaved`,Category:`Category`,Manager:`Manager`,Company:`Company`,AppVersion:`Version`,ContentStatus:`ContentStatus`,Identifier:`Identifier`,Language:`Language`},ha;function ga(e,t,n){ha||=Dt(ma),t=ha[t]||t,e[t]=n}function _a(e){var t=e.read_shift(4),n=e.read_shift(4);return new Date((n/1e7*2**32+t/1e7-11644473600)*1e3).toISOString().replace(/\.000/,``)}function va(e,t,n){var r=e.l,i=e.read_shift(0,`lpstr-cp`);if(n)for(;e.l-r&3;)++e.l;return i}function ya(e,t,n){var r=e.read_shift(0,`lpwstr`);return n&&(e.l+=4-(r.length+1&3)&3),r}function ba(e,t,n){return t===31?ya(e):va(e,t,n)}function xa(e,t,n){return ba(e,t,n===!1?0:4)}function Sa(e,t){if(!t)throw Error(`VtUnalignedString must have positive length`);return ba(e,t,0)}function Ca(e){for(var t=e.read_shift(4),n=[],r=0;r!=t;++r){var i=e.l;n[r]=e.read_shift(0,`lpwstr`).replace(fe,``),e.l-i&2&&(e.l+=2)}return n}function wa(e){for(var t=e.read_shift(4),n=[],r=0;r!=t;++r)n[r]=e.read_shift(0,`lpstr-cp`).replace(fe,``);return n}function Ta(e){var t=e.l,n=Aa(e,Hi);return e[e.l]==0&&e[e.l+1]==0&&e.l-t&2&&(e.l+=2),[n,Aa(e,Mi)]}function Ea(e){for(var t=e.read_shift(4),n=[],r=0;r<t/2;++r)n.push(Ta(e));return n}function Da(e,t){for(var n=e.read_shift(4),r={},i=0;i!=n;++i){var a=e.read_shift(4),o=e.read_shift(4);r[a]=e.read_shift(o,t===1200?`utf16le`:`utf8`).replace(fe,``).replace(pe,`!`),t===1200&&o%2&&(e.l+=2)}return e.l&3&&(e.l=e.l>>3<<2),r}function Oa(e){var t=e.read_shift(4),n=e.slice(e.l,e.l+t);return e.l+=t,(t&3)>0&&(e.l+=4-(t&3)&3),n}function ka(e){var t={};return t.Size=e.read_shift(4),e.l+=t.Size+3-(t.Size-1)%4,t}function Aa(e,t,n){var r=e.read_shift(2),i,a=n||{};if(e.l+=2,t!==Pi&&r!==t&&Ui.indexOf(t)===-1&&!((t&65534)==4126&&(r&65534)==4126))throw Error(`Expected type `+t+` saw `+r);switch(t===Pi?r:t){case 2:return i=e.read_shift(2,`i`),a.raw||(e.l+=2),i;case 3:return i=e.read_shift(4,`i`),i;case 11:return e.read_shift(4)!==0;case 19:return i=e.read_shift(4),i;case 30:e.l+=4,val=xa(e,e[e.l-4]).replace(/(^|[^\u0000])\u0000+$/,`$1`);break;case 31:e.l+=4,val=xa(e,e[e.l-4]).replace(/(^|[^\u0000])\u0000+$/,`$1`);break;case 64:return _a(e);case 65:return Oa(e);case 71:return ka(e);case 80:return xa(e,r,!a.raw).replace(fe,``);case 81:return Sa(e,r).replace(fe,``);case 4108:return Ea(e);case 4126:case 4127:return r==4127?Ca(e):wa(e);default:throw Error(`TypedPropertyValue unrecognized type `+t+` `+r)}}function ja(e,t){var n=e.l,r=e.read_shift(4),i=e.read_shift(4),a=[],o=0,s=0,c=-1,l={};for(o=0;o!=i;++o)a[o]=[e.read_shift(4),e.read_shift(4)+n];a.sort(function(e,t){return e[1]-t[1]});var u={};for(o=0;o!=i;++o){if(e.l!==a[o][1]){var d=!0;if(o>0&&t)switch(t[a[o-1][0]].t){case 2:e.l+2===a[o][1]&&(e.l+=2,d=!1);break;case 80:e.l<=a[o][1]&&(e.l=a[o][1],d=!1);break;case 4108:e.l<=a[o][1]&&(e.l=a[o][1],d=!1);break}if((!t||o==0)&&e.l<=a[o][1]&&(d=!1,e.l=a[o][1]),d)throw Error(`Read Error: Expected address `+a[o][1]+` at `+e.l+` :`+o)}if(t){if(a[o][0]==0&&a.length>o+1&&a[o][1]==a[o+1][1])continue;var f=t[a[o][0]];if(u[f.n]=Aa(e,f.t,{raw:!0}),f.p===`version`&&(u[f.n]=String(u[f.n]>>16)+`.`+(`0000`+String(u[f.n]&65535)).slice(-4)),f.n==`CodePage`)switch(u[f.n]){case 0:u[f.n]=1252;case 874:case 932:case 936:case 949:case 950:case 1250:case 1251:case 1253:case 1254:case 1255:case 1256:case 1257:case 1258:case 1e4:case 1200:case 1201:case 1252:case 65e3:case-536:case 65001:case-535:N(s=u[f.n]>>>0&65535);break;default:throw Error(`Unsupported CodePage: `+u[f.n])}}else if(a[o][0]===1){if(s=u.CodePage=Aa(e,ji),N(s),c!==-1){var p=e.l;e.l=a[c][1],l=Da(e,s),e.l=p}}else if(a[o][0]===0){if(s===0){c=o,e.l=a[o+1][1];continue}l=Da(e,s)}else{var m=l[a[o][0]],h;switch(e[e.l]){case 65:e.l+=4,h=Oa(e);break;case 30:e.l+=4,h=xa(e,e[e.l-4]).replace(/(^|[^\u0000])\u0000+$/,`$1`);break;case 31:e.l+=4,h=xa(e,e[e.l-4]).replace(/(^|[^\u0000])\u0000+$/,`$1`);break;case 3:e.l+=4,h=e.read_shift(4,`i`);break;case 19:e.l+=4,h=e.read_shift(4);break;case 5:e.l+=4,h=e.read_shift(8,`f`);break;case 11:e.l+=4,h=Fa(e,4);break;case 64:e.l+=4,h=Lt(_a(e));break;default:throw Error(`unparsed value: `+e[e.l])}u[m]=h}}return e.l=n+r,u}function Ma(e,t,n){var r=e.content;if(!r)return{};Ir(r,0);var i,a,o,s,c=0;r.chk(`feff`,`Byte Order: `),r.read_shift(2);var l=r.read_shift(4),u=r.read_shift(16);if(u!==K.utils.consts.HEADER_CLSID&&u!==n)throw Error(`Bad PropertySet CLSID `+u);if(i=r.read_shift(4),i!==1&&i!==2)throw Error(`Unrecognized #Sets: `+i);if(a=r.read_shift(16),s=r.read_shift(4),i===1&&s!==r.l)throw Error(`Length mismatch: `+s+` !== `+r.l);i===2&&(o=r.read_shift(16),c=r.read_shift(4));var d=ja(r,t),f={SystemIdentifier:l};for(var p in d)f[p]=d[p];if(f.FMTID=a,i===1)return f;if(c-r.l==2&&(r.l+=2),r.l!==c)throw Error(`Length mismatch 2: `+r.l+` !== `+c);var m;try{m=ja(r,null)}catch{}for(p in m)f[p]=m[p];return f.FMTID=[a,o],f}function Na(e,t){return e.read_shift(t),null}function Pa(e,t,n){for(var r=[],i=e.l+t;e.l<i;)r.push(n(e,i-e.l));if(i!==e.l)throw Error(`Slurp error`);return r}function Fa(e,t){return e.read_shift(t)===1}function Ia(e){return e.read_shift(2,`u`)}function La(e,t){return Pa(e,t,Ia)}function Ra(e){var t=e.read_shift(1);return e.read_shift(1)===1?t:t===1}function za(e,t,n){var r=e.read_shift(n&&n.biff>=12?2:1),i=`sbcs-cont`,a=E;n&&n.biff>=8&&(E=1200),!n||n.biff==8?e.read_shift(1)&&(i=`dbcs-cont`):n.biff==12&&(i=`wstr`),n.biff>=2&&n.biff<=5&&(i=`cpstr`);var o=r?e.read_shift(r,i):``;return E=a,o}function Ba(e){var t=E;E=1200;var n=e.read_shift(2),r=e.read_shift(1),i=r&4,a=r&8,o=1+(r&1),s=0,c,l={};a&&(s=e.read_shift(2)),i&&(c=e.read_shift(4));var u=o==2?`dbcs-cont`:`sbcs-cont`,d=n===0?``:e.read_shift(n,u);return a&&(e.l+=4*s),i&&(e.l+=c),l.t=d,a||(l.raw=`<t>`+l.t+`</t>`,l.r=l.t),E=t,l}function Va(e,t,n){var r;if(n){if(n.biff>=2&&n.biff<=5)return e.read_shift(t,`cpstr`);if(n.biff>=12)return e.read_shift(t,`dbcs-cont`)}return r=e.read_shift(1)===0?e.read_shift(t,`sbcs-cont`):e.read_shift(t,`dbcs-cont`),r}function Ha(e,t,n){var r=e.read_shift(n&&n.biff==2?1:2);return r===0?(e.l++,``):Va(e,r,n)}function Ua(e,t,n){if(n.biff>5)return Ha(e,t,n);var r=e.read_shift(1);return r===0?(e.l++,``):e.read_shift(r,n.biff<=4||!e.lens?`cpstr`:`sbcs-cont`)}function Wa(e){var t=e.read_shift(1);e.l++;var n=e.read_shift(2);return e.l+=2,[t,n]}function Ga(e){var t=e.read_shift(4),n=e.l,r=!1;t>24&&(e.l+=t-24,e.read_shift(16)===`795881f43b1d7f48af2c825dc4852763`&&(r=!0),e.l=n);var i=e.read_shift((r?t-24:t)>>1,`utf16le`).replace(fe,``);return r&&(e.l+=24),i}function Ka(e){for(var t=e.read_shift(2),n=``;t-->0;)n+=`../`;var r=e.read_shift(0,`lpstr-ansi`);if(e.l+=2,e.read_shift(2)!=57005)throw Error(`Bad FileMoniker`);if(e.read_shift(4)===0)return n+r.replace(/\\/g,`/`);var i=e.read_shift(4);if(e.read_shift(2)!=3)throw Error(`Bad FileMoniker`);var a=e.read_shift(i>>1,`utf16le`).replace(fe,``);return n+a}function qa(e,t){var n=e.read_shift(16);switch(t-=16,n){case`e0c9ea79f9bace118c8200aa004ba90b`:return Ga(e,t);case`0303000000000000c000000000000046`:return Ka(e,t);default:throw Error(`Unsupported Moniker `+n)}}function Ja(e){var t=e.read_shift(4);return t>0?e.read_shift(t,`utf16le`).replace(fe,``):``}function Ya(e,t){var n=e.l+t,r=e.read_shift(4);if(r!==2)throw Error(`Unrecognized streamVersion: `+r);var i=e.read_shift(2);e.l+=2;var a,o,s,c,l=``,u,d;i&16&&(a=Ja(e,n-e.l)),i&128&&(o=Ja(e,n-e.l)),(i&257)==257&&(s=Ja(e,n-e.l)),(i&257)==1&&(c=qa(e,n-e.l)),i&8&&(l=Ja(e,n-e.l)),i&32&&(u=e.read_shift(16)),i&64&&(d=_a(e)),e.l=n;var f=o||s||c||``;f&&l&&(f+=`#`+l),f||=`#`+l,i&2&&f.charAt(0)==`/`&&f.charAt(1)!=`/`&&(f=`file://`+f);var p={Target:f};return u&&(p.guid=u),d&&(p.time=d),a&&(p.Tooltip=a),p}function Xa(e){return[e.read_shift(1),e.read_shift(1),e.read_shift(1),e.read_shift(1)]}function Za(e,t){var n=Xa(e,t);return n[3]=0,n}function Qa(e,t,n){var r={r:e.read_shift(2),c:e.read_shift(2),ixfe:0};return n&&n.biff==2||t==7?(r.ixfe=e.read_shift(1)&63,e.l+=2):r.ixfe=e.read_shift(2),r}function $a(e){var t=e.read_shift(2),n=e.read_shift(2);return e.l+=8,{type:t,flags:n}}function eo(e,t,n){return t===0?``:Ua(e,t,n)}function to(e,t,n){var r=n.biff>8?4:2;return[e.read_shift(r),e.read_shift(r,`i`),e.read_shift(r,`i`)]}function no(e){return[e.read_shift(2),Ci(e)]}function ro(e,t,n){e.l+=4,t-=4;var r=e.l+t,i=za(e,t,n),a=e.read_shift(2);if(r-=e.l,a!==r)throw Error(`Malformed AddinUdf: padding = `+r+` != `+a);return e.l+=a,i}function Y(e){var t=e.read_shift(2),n=e.read_shift(2),r=e.read_shift(2),i=e.read_shift(2);return{s:{c:r,r:t},e:{c:i,r:n}}}function io(e){var t=e.read_shift(2),n=e.read_shift(2),r=e.read_shift(1),i=e.read_shift(1);return{s:{c:r,r:t},e:{c:i,r:n}}}var ao=io;function oo(e){e.l+=4;var t=e.read_shift(2),n=e.read_shift(2),r=e.read_shift(2);return e.l+=12,[n,t,r]}function so(e){var t={};return e.l+=4,e.l+=16,t.fSharedNote=e.read_shift(2),e.l+=4,t}function co(e){return e.l+=4,e.cf=e.read_shift(2),{}}function lo(e){e.l+=2,e.l+=e.read_shift(2)}var uo={0:lo,4:lo,5:lo,6:lo,7:co,8:lo,9:lo,10:lo,11:lo,12:lo,13:so,14:lo,15:lo,16:lo,17:lo,18:lo,19:lo,20:lo,21:oo};function fo(e,t){for(var n=e.l+t,r=[];e.l<n;){var i=e.read_shift(2);e.l-=2;try{r[i]=uo[i](e,n-e.l)}catch{return e.l=n,r}}return e.l!=n&&(e.l=n),r}function po(e,t){var n={BIFFVer:0,dt:0};switch(n.BIFFVer=e.read_shift(2),t-=2,t>=2&&(n.dt=e.read_shift(2),e.l-=2),n.BIFFVer){case 1536:case 1280:case 1024:case 768:case 512:case 2:case 7:break;default:if(t>6)throw Error(`Unexpected BIFF Ver `+n.BIFFVer)}return e.read_shift(t),n}function mo(e,t){return t===0||e.read_shift(2),1200}function ho(e,t,n){if(n.enc)return e.l+=t,``;var r=e.l,i=Ua(e,0,n);return e.read_shift(t+r-e.l),i}function go(e,t,n){var r=n&&n.biff==8||t==2?e.read_shift(2):(e.l+=t,0);return{fDialog:r&16,fBelow:r&64,fRight:r&128}}function _o(e,t,n){var r=``;if(n.biff==4)return r=za(e,0,n),r.length===0&&(r=`Sheet1`),{name:r};var i=e.read_shift(4),a=e.read_shift(1)&3,o=e.read_shift(1);switch(o){case 0:o=`Worksheet`;break;case 1:o=`Macrosheet`;break;case 2:o=`Chartsheet`;break;case 6:o=`VBAModule`;break}return r=za(e,0,n),r.length===0&&(r=`Sheet1`),{pos:i,hs:a,dt:o,name:r}}function vo(e,t){for(var n=e.l+t,r=e.read_shift(4),i=e.read_shift(4),a=[],o=0;o!=i&&e.l<n;++o)a.push(Ba(e));return a.Count=r,a.Unique=i,a}function yo(e,t){var n={};return n.dsst=e.read_shift(2),e.l+=t-2,n}function bo(e){var t={};t.r=e.read_shift(2),t.c=e.read_shift(2),t.cnt=e.read_shift(2)-t.c;var n=e.read_shift(2);e.l+=4;var r=e.read_shift(1);return e.l+=3,r&7&&(t.level=r&7),r&32&&(t.hidden=!0),r&64&&(t.hpt=n/20),t}function xo(e){var t=$a(e);if(t.type!=2211)throw Error(`Invalid Future Record `+t.type);return e.read_shift(4)!==0}function So(e){return e.read_shift(2),e.read_shift(4)}function Co(e,t,n){var r=0;n&&n.biff==2||(r=e.read_shift(2));var i=e.read_shift(2);return n&&n.biff==2&&(r=1-(i>>15),i&=32767),[{Unsynced:r&1,DyZero:(r&2)>>1,ExAsc:(r&4)>>2,ExDsc:(r&8)>>3},i]}function wo(e){var t=e.read_shift(2),n=e.read_shift(2),r=e.read_shift(2),i=e.read_shift(2),a=e.read_shift(2),o=e.read_shift(2),s=e.read_shift(2),c=e.read_shift(2),l=e.read_shift(2);return{Pos:[t,n],Dim:[r,i],Flags:a,CurTab:o,FirstTab:s,Selected:c,TabRatio:l}}function To(e,t,n){return n&&n.biff>=2&&n.biff<5?{}:{RTL:e.read_shift(2)&64}}function Eo(){}function Do(e,t,n){var r={dyHeight:e.read_shift(2),fl:e.read_shift(2)};switch(n&&n.biff||8){case 2:break;case 3:case 4:e.l+=2;break;default:e.l+=10;break}return r.name=za(e,0,n),r}function Oo(e,t,n){var r=Qa(e,t,n);return r.isst=e.read_shift(4),r}function ko(e,t,n){n.biffguess&&n.biff==2&&(n.biff=5);var r=e.l+t,i=Qa(e,t,n);return i.val=Ha(e,r-e.l,n),i}function Ao(e,t,n){return[e.read_shift(2),Ua(e,0,n)]}var jo=Ua;function Mo(e,t,n){var r=e.l+t,i=n.biff==8||!n.biff?4:2,a=e.read_shift(i),o=e.read_shift(i),s=e.read_shift(2),c=e.read_shift(2);return e.l=r,{s:{r:a,c:s},e:{r:o,c}}}function No(e){var t=e.read_shift(2),n=e.read_shift(2),r=no(e);return{r:t,c:n,ixfe:r[0],rknum:r[1]}}function Po(e,t){for(var n=e.l+t-2,r=e.read_shift(2),i=e.read_shift(2),a=[];e.l<n;)a.push(no(e));if(e.l!==n)throw Error(`MulRK read error`);var o=e.read_shift(2);if(a.length!=o-i+1)throw Error(`MulRK length mismatch`);return{r,c:i,C:o,rkrec:a}}function Fo(e,t){for(var n=e.l+t-2,r=e.read_shift(2),i=e.read_shift(2),a=[];e.l<n;)a.push(e.read_shift(2));if(e.l!==n)throw Error(`MulBlank read error`);var o=e.read_shift(2);if(a.length!=o-i+1)throw Error(`MulBlank length mismatch`);return{r,c:i,C:o,ixfe:a}}function Io(e,t,n,r){var i={},a=e.read_shift(4),o=e.read_shift(4),s=e.read_shift(4),c=e.read_shift(2);return i.patternType=qi[s>>26],r.cellStyles?(i.alc=a&7,i.fWrap=a>>3&1,i.alcV=a>>4&7,i.fJustLast=a>>7&1,i.trot=a>>8&255,i.cIndent=a>>16&15,i.fShrinkToFit=a>>20&1,i.iReadOrder=a>>22&2,i.fAtrNum=a>>26&1,i.fAtrFnt=a>>27&1,i.fAtrAlc=a>>28&1,i.fAtrBdr=a>>29&1,i.fAtrPat=a>>30&1,i.fAtrProt=a>>31&1,i.dgLeft=o&15,i.dgRight=o>>4&15,i.dgTop=o>>8&15,i.dgBottom=o>>12&15,i.icvLeft=o>>16&127,i.icvRight=o>>23&127,i.grbitDiag=o>>30&3,i.icvTop=s&127,i.icvBottom=s>>7&127,i.icvDiag=s>>14&127,i.dgDiag=s>>21&15,i.icvFore=c&127,i.icvBack=c>>7&127,i.fsxButton=c>>14&1,i):i}function Lo(e,t,n){var r={};return r.ifnt=e.read_shift(2),r.numFmtId=e.read_shift(2),r.flags=e.read_shift(2),r.fStyle=r.flags>>2&1,t-=6,r.data=Io(e,t,r.fStyle,n),r}function Ro(e){var t={};return t.ifnt=e.read_shift(1),e.l++,t.flags=e.read_shift(1),t.numFmtId=t.flags&63,t.flags>>=6,t.fStyle=0,t.data={},t}function zo(e){var t={};return t.ifnt=e.read_shift(1),t.numFmtId=e.read_shift(1),t.flags=e.read_shift(2),t.fStyle=t.flags>>2&1,t.data={},t}function Bo(e){var t={};return t.ifnt=e.read_shift(1),t.numFmtId=e.read_shift(1),t.flags=e.read_shift(2),t.fStyle=t.flags>>2&1,t.data={},t}function Vo(e){e.l+=4;var t=[e.read_shift(2),e.read_shift(2)];if(t[0]!==0&&t[0]--,t[1]!==0&&t[1]--,t[0]>7||t[1]>7)throw Error(`Bad Gutters: `+t.join(`|`));return t}function Ho(e,t,n){var r=Qa(e,6,n),i=Ra(e,2);return r.val=i,r.t=i===!0||i===!1?`b`:`e`,r}function Uo(e,t,n){n.biffguess&&n.biff==2&&(n.biff=5);var r=Qa(e,6,n);return r.val=J(e,8),r}var Wo=eo;function Go(e,t,n){var r=e.l+t,i=e.read_shift(2),a=e.read_shift(2);if(n.sbcch=a,a==1025||a==14849)return[a,i];if(a<1||a>255)throw Error(`Unexpected SupBook type: `+a);for(var o=Va(e,a),s=[];r>e.l;)s.push(Ha(e));return[a,i,o,s]}function Ko(e,t,n){var r=e.read_shift(2),i,a={fBuiltIn:r&1,fWantAdvise:r>>>1&1,fWantPict:r>>>2&1,fOle:r>>>3&1,fOleLink:r>>>4&1,cf:r>>>5&1023,fIcon:r>>>15&1};return n.sbcch===14849&&(i=ro(e,t-2,n)),a.body=i||e.read_shift(t-2),typeof i==`string`&&(a.Name=i),a}function qo(e,t,n){var r=e.l+t,i=e.read_shift(2),a=e.read_shift(1),o=e.read_shift(1),s=e.read_shift(n&&n.biff==2?1:2),c=0;(!n||n.biff>=5)&&(n.biff!=5&&(e.l+=2),c=e.read_shift(2),n.biff==5&&(e.l+=2),e.l+=4);var l=Va(e,o,n);i&32&&(l=Qi[l.charCodeAt(0)]);var u=r-e.l;n&&n.biff==2&&--u;var d=r==e.l||s===0||!(u>0)?[]:yd(e,u,n,s);return{chKey:a,Name:l,itab:c,rgce:d}}function Jo(e,t,n){if(n.biff<8||!(n.biff>8)&&t==e[e.l]+ +(e[e.l+1]==3)+1)return Yo(e,t,n);for(var r=[],i=e.l+t,a=e.read_shift(n.biff>8?4:2);a--!==0;)r.push(to(e,n.biff>8?12:6,n));if(e.l!=i)throw Error(`Bad ExternSheet: `+e.l+` != `+i);return r}function Yo(e,t,n){e[e.l+1]==3&&e[e.l]++;var r=za(e,t,n);return r.charCodeAt(0)==3?r.slice(1):r}function Xo(e,t,n){if(n.biff<8){e.l+=t;return}var r=e.read_shift(2),i=e.read_shift(2);return[Va(e,r,n),Va(e,i,n)]}function Zo(e,t,n){var r=io(e,6);e.l++;var i=e.read_shift(1);return t-=8,[bd(e,t,n),i,r]}function Qo(e,t,n){var r=ao(e,6);switch(n.biff){case 2:e.l++,t-=7;break;case 3:case 4:e.l+=2,t-=8;break;default:e.l+=6,t-=12}return[r,_d(e,t,n,r)]}function $o(e){return[e.read_shift(4)!==0,e.read_shift(4)!==0,e.read_shift(4)]}function es(e,t,n){var r=e.read_shift(2),i=e.read_shift(2),a=e.read_shift(2),o=e.read_shift(2),s=Ua(e,0,n);return[{r,c:i},s,o,a]}function ts(e,t,n){if(n&&n.biff<8){var r=e.read_shift(2),i=e.read_shift(2);if(r==65535||r==-1)return;var a=e.read_shift(2),o=e.read_shift(Math.min(a,2048),`cpstr`);return[{r,c:i},o]}return es(e,t,n)}function ns(e,t){for(var n=[],r=e.read_shift(2);r--;)n.push(Y(e,t));return n}function rs(e,t,n){if(n&&n.biff<8)return as(e,t,n);var r=oo(e,22);return{cmo:r,ft:fo(e,t-22,r[1])}}var is={8:function(e,t){var n=e.l+t;e.l+=10;var r=e.read_shift(2);e.l+=4,e.l+=2,e.l+=2,e.l+=2,e.l+=4;var i=e.read_shift(1);return e.l+=i,e.l=n,{fmt:r}}};function as(e,t,n){e.l+=4;var r=e.read_shift(2),i=e.read_shift(2),a=e.read_shift(2);e.l+=2,e.l+=2,e.l+=2,e.l+=2,e.l+=2,e.l+=2,e.l+=2,e.l+=2,e.l+=2,e.l+=6,t-=36;var o=[];return o.push((is[r]||Lr)(e,t,n)),{cmo:[i,r,a],ft:o}}function os(e,t,n){var r=e.l,i=``;try{e.l+=4;var a=(n.lastobj||{cmo:[0,0]}).cmo[1];[0,5,7,11,12,14].indexOf(a)==-1?e.l+=6:Wa(e,6,n);var o=e.read_shift(2);e.read_shift(2),Ia(e,2);var s=e.read_shift(2);e.l+=s;for(var c=1;c<e.lens.length-1;++c){if(e.l-r!=e.lens[c])throw Error(`TxO: bad continue record`);var l=e[e.l],u=Va(e,e.lens[c+1]-e.lens[c]-1);if(i+=u,i.length>=(l?o:2*o))break}if(i.length!==o&&i.length!==o*2)throw Error(`cchText: `+o+` != `+i.length);return e.l=r+t,{t:i}}catch{return e.l=r+t,{t:i}}}function ss(e,t){var n=Y(e,8);return e.l+=16,[n,Ya(e,t-24)]}function cs(e,t){e.read_shift(2);var n=Y(e,8),r=e.read_shift((t-10)/2,`dbcs-cont`);return r=r.replace(fe,``),[n,r]}function ls(e){var t=[0,0],n=e.read_shift(2);return t[0]=Ki[n]||n,n=e.read_shift(2),t[1]=Ki[n]||n,t}function us(e){for(var t=e.read_shift(2),n=[];t-->0;)n.push(Za(e,8));return n}function ds(e){for(var t=e.read_shift(2),n=[];t-->0;)n.push(Za(e,8));return n}function fs(e){e.l+=2;var t={cxfs:0,crc:0};return t.cxfs=e.read_shift(2),t.crc=e.read_shift(4),t}function ps(e,t,n){if(!n.cellStyles)return Lr(e,t);var r=n&&n.biff>=12?4:2,i=e.read_shift(r),a=e.read_shift(r),o=e.read_shift(r),s=e.read_shift(r),c=e.read_shift(2);r==2&&(e.l+=2);var l={s:i,e:a,w:o,ixfe:s,flags:c};return(n.biff>=5||!n.biff)&&(l.level=c>>8&7),l}function ms(e,t){var n={};return t<32?n:(e.l+=16,n.header=J(e,8),n.footer=J(e,8),e.l+=2,n)}function hs(e,t,n){var r={area:!1};if(n.biff!=5)return e.l+=t,r;var i=e.read_shift(1);return e.l+=3,i&16&&(r.area=!0),r}var gs=Qa,_s=La,vs=Ha;function ys(e){var t=e.read_shift(2),n=e.read_shift(2),r=e.read_shift(4),i={fmt:t,env:n,len:r,data:e.slice(e.l,e.l+r)};return e.l+=r,i}function bs(e,t,n){n.biffguess&&n.biff==5&&(n.biff=2);var r=Qa(e,7,n),i=Ua(e,t-7,n);return r.t=`str`,r.val=i,r}function xs(e,t,n){var r=Qa(e,7,n),i=J(e,8);return r.t=`n`,r.val=i,r}function Ss(e,t,n){var r=Qa(e,7,n),i=e.read_shift(2);return r.t=`n`,r.val=i,r}function Cs(e){var t=e.read_shift(1);return t===0?(e.l++,``):e.read_shift(t,`sbcs-cont`)}function ws(e,t,n){var r=e.l+7,i=Qa(e,6,n);e.l=r;var a=Ra(e,2);return i.val=a,i.t=a===!0||a===!1?`b`:`e`,i}function Ts(e,t){e.l+=6,e.l+=2,e.l+=1,e.l+=3,e.l+=1,e.l+=t-13}function Es(e,t,n){var r=e.l+t,i=Qa(e,6,n),a=Va(e,e.read_shift(2),n);return e.l=r,i.t=`str`,i.val=a,i}function Ds(e){var t=e.read_shift(4),n=e.read_shift(1),r=e.read_shift(n,`sbcs`);return r.length===0&&(r=`Sheet1`),{flags:t,name:r}}var Os=[2,3,48,49,131,139,140,245],ks=(function(){var e={1:437,2:850,3:1252,4:1e4,100:852,101:866,102:865,103:861,104:895,105:620,106:737,107:857,120:950,121:949,122:936,123:932,124:874,125:1255,126:1256,150:10007,151:10029,152:10006,200:1250,201:1251,202:1254,203:1253,0:20127,8:865,9:437,10:850,11:437,13:437,14:850,15:437,16:850,17:437,18:850,19:932,20:850,21:437,22:850,23:865,24:437,25:437,26:850,27:437,28:863,29:850,31:852,34:852,35:852,36:860,37:850,38:866,55:850,64:852,77:936,78:949,79:950,80:874,87:1252,88:1252,89:1252,108:863,134:737,135:852,136:857,204:1257,255:16969},t=Dt({1:437,2:850,3:1252,4:1e4,100:852,101:866,102:865,103:861,104:895,105:620,106:737,107:857,120:950,121:949,122:936,123:932,124:874,125:1255,126:1256,150:10007,151:10029,152:10006,200:1250,201:1251,202:1254,203:1253,0:20127});function n(t,n){var r=[],i=oe(1);switch(n.type){case`base64`:i=se(H(t));break;case`binary`:i=se(t);break;case`buffer`:case`array`:i=t;break}Ir(i,0);var a=i.read_shift(1),o=!!(a&136),s=!1,c=!1;switch(a){case 2:break;case 3:break;case 48:s=!0,o=!0;break;case 49:s=!0,o=!0;break;case 131:break;case 139:break;case 140:c=!0;break;case 245:break;default:throw Error(`DBF Unsupported Version: `+a.toString(16))}var l=0,u=521;a==2&&(l=i.read_shift(2)),i.l+=3,a!=2&&(l=i.read_shift(4)),l>1048576&&(l=1e6),a!=2&&(u=i.read_shift(2));var d=i.read_shift(2),f=n.codepage||1252;a!=2&&(i.l+=16,i.read_shift(1),i[i.l]!==0&&(f=e[i[i.l]]),i.l+=1,i.l+=2),c&&(i.l+=36);for(var p=[],m={},h=Math.min(i.length,a==2?521:u-10-(s?264:0)),g=c?32:11;i.l<h&&i[i.l]!=13;)switch(m={},m.name=(O===void 0?ce(i.slice(i.l,i.l+g)):O.utils.decode(f,i.slice(i.l,i.l+g))).replace(/[\u0000\r\n][\S\s]*$/g,``),i.l+=g,m.type=String.fromCharCode(i.read_shift(1)),a!=2&&!c&&(m.offset=i.read_shift(4)),m.len=i.read_shift(1),a==2&&(m.offset=i.read_shift(2)),m.dec=i.read_shift(1),m.name.length&&p.push(m),a!=2&&(i.l+=c?13:14),m.type){case`B`:(!s||m.len!=8)&&n.WTF&&console.log(`Skipping `+m.name+`:`+m.type);break;case`G`:case`P`:n.WTF&&console.log(`Skipping `+m.name+`:`+m.type);break;case`+`:case`0`:case`@`:case`C`:case`D`:case`F`:case`I`:case`L`:case`M`:case`N`:case`O`:case`T`:case`Y`:break;default:throw Error(`Unknown Field Type: `+m.type)}if(i[i.l]!==13&&(i.l=u-1),i.read_shift(1)!==13)throw Error(`DBF Terminator not found `+i.l+` `+i[i.l]);i.l=u;var _=0,v=0;for(r[0]=[],v=0;v!=p.length;++v)r[0][v]=p[v].name;for(;l-->0;){if(i[i.l]===42){i.l+=d;continue}for(++i.l,r[++_]=[],v=0,v=0;v!=p.length;++v){var y=i.slice(i.l,i.l+p[v].len);i.l+=p[v].len,Ir(y,0);var b=O===void 0?ce(y):O.utils.decode(f,y);switch(p[v].type){case`C`:b.trim().length&&(r[_][v]=b.replace(/([^\s])\s+$/,`$1`));break;case`D`:b.length===8?(r[_][v]=new Date(Date.UTC(+b.slice(0,4),b.slice(4,6)-1,+b.slice(6,8),0,0,0,0)),n&&n.UTC||(r[_][v]=Zt(r[_][v]))):r[_][v]=b;break;case`F`:r[_][v]=parseFloat(b.trim());break;case`+`:case`I`:r[_][v]=c?y.read_shift(-4,`i`)^2147483648:y.read_shift(4,`i`);break;case`L`:switch(b.trim().toUpperCase()){case`Y`:case`T`:r[_][v]=!0;break;case`N`:case`F`:r[_][v]=!1;break;case``:case`\0`:case`?`:break;default:throw Error(`DBF Unrecognized L:|`+b+`|`)}break;case`M`:if(!o)throw Error(`DBF Unexpected MEMO for type `+a.toString(16));r[_][v]=`##MEMO##`+(c?parseInt(b.trim(),10):y.read_shift(4));break;case`N`:b=b.replace(/\u0000/g,``).trim(),b&&b!=`.`&&(r[_][v]=+b||0);break;case`@`:r[_][v]=new Date(y.read_shift(-8,`f`)-621356832e5);break;case`T`:var x=y.read_shift(4),S=y.read_shift(4);if(x==0&&S==0)break;r[_][v]=new Date((x-2440588)*864e5+S),n&&n.UTC||(r[_][v]=Zt(r[_][v]));break;case`Y`:r[_][v]=y.read_shift(4,`i`)/1e4+y.read_shift(4,`i`)/1e4*2**32;break;case`O`:r[_][v]=-y.read_shift(-8,`f`);break;case`B`:if(s&&p[v].len==8){r[_][v]=y.read_shift(8,`f`);break}case`G`:case`P`:y.l+=p[v].len;break;case`0`:if(p[v].name===`_NullFlags`)break;default:throw Error(`DBF Unsupported data type `+p[v].type)}}}if(a!=2&&i.l<i.length&&i[i.l++]!=26)throw Error(`DBF EOF Marker missing `+(i.l-1)+` of `+i.length+` `+i[i.l-1].toString(16));return n&&n.sheetRows&&(r=r.slice(0,n.sheetRows)),n.DBF=p,r}function r(e,t){var r=t||{};r.dateNF||=`yyyymmdd`;var i=di(n(e,r),r);return i[`!cols`]=r.DBF.map(function(e){return{wch:e.len,DBF:e}}),delete r.DBF,i}function i(e,t){try{var n=ci(r(e,t),t);return n.bookType=`dbf`,n}catch(e){if(t&&t.WTF)throw e}return{SheetNames:[],Sheets:{}}}var a={B:8,C:250,L:1,D:8,"?":0,"":0};function o(n,r){if(!n[`!ref`])throw Error(`Cannot export empty sheet to DBF`);var i=r||{},o=E;if(+i.codepage>=0&&N(+i.codepage),i.type==`string`)throw Error(`Cannot write DBF to JS string`);var s=Br(),c=Zm(n,{header:1,raw:!0,cellDates:!0}),l=c[0],u=c.slice(1),d=n[`!cols`]||[],f=0,p=0,m=0,h=1;for(f=0;f<l.length;++f){if(((d[f]||{}).DBF||{}).name){l[f]=d[f].DBF.name,++m;continue}if(l[f]!=null){if(++m,typeof l[f]==`number`&&(l[f]=l[f].toString(10)),typeof l[f]!=`string`)throw Error(`DBF Invalid column name `+l[f]+` |`+typeof l[f]+`|`);if(l.indexOf(l[f])!==f){for(p=0;p<1024;++p)if(l.indexOf(l[f]+`_`+p)==-1){l[f]+=`_`+p;break}}}}var g=ai(n[`!ref`]),_=[],v=[],y=[];for(f=0;f<=g.e.c-g.s.c;++f){var b=``,x=``,S=0,C=[];for(p=0;p<u.length;++p)u[p][f]!=null&&C.push(u[p][f]);if(C.length==0||l[f]==null){_[f]=`?`;continue}for(p=0;p<C.length;++p){switch(typeof C[p]){case`number`:x=`B`;break;case`string`:x=`C`;break;case`boolean`:x=`L`;break;case`object`:x=C[p]instanceof Date?`D`:`C`;break;default:x=`C`}S=Math.max(S,(O!==void 0&&typeof C[p]==`string`?O.utils.encode(D,C[p]):String(C[p])).length),b=b&&b!=x?`C`:x}S>250&&(S=250),x=((d[f]||{}).DBF||{}).type,x==`C`&&d[f].DBF.len>S&&(S=d[f].DBF.len),b==`B`&&x==`N`&&(b=`N`,y[f]=d[f].DBF.dec,S=d[f].DBF.len),v[f]=b==`C`||x==`N`?S:a[b]||0,h+=v[f],_[f]=b}var w=s.next(32);for(w.write_shift(4,318902576),w.write_shift(4,u.length),w.write_shift(2,296+32*m),w.write_shift(2,h),f=0;f<4;++f)w.write_shift(4,0);var T=+t[E]||3;for(w.write_shift(4,0|T<<8),e[T]!=+i.codepage&&(i.codepage&&console.error(`DBF Unsupported codepage `+E+`, using 1252`),E=1252),f=0,p=0;f<l.length;++f)if(l[f]!=null){var k=s.next(32),A=(l[f].slice(-10)+`\0\0\0\0\0\0\0\0\0\0\0`).slice(0,11);k.write_shift(1,A,`sbcs`),k.write_shift(1,_[f]==`?`?`C`:_[f],`sbcs`),k.write_shift(4,p),k.write_shift(1,v[f]||a[_[f]]||0),k.write_shift(1,y[f]||0),k.write_shift(1,2),k.write_shift(4,0),k.write_shift(1,0),k.write_shift(4,0),k.write_shift(4,0),p+=v[f]||a[_[f]]||0}var j=s.next(264);for(j.write_shift(4,13),f=0;f<65;++f)j.write_shift(4,0);for(f=0;f<u.length;++f){var M=s.next(h);for(M.write_shift(1,0),p=0;p<l.length;++p)if(l[p]!=null)switch(_[p]){case`L`:M.write_shift(1,u[f][p]==null?63:u[f][p]?84:70);break;case`B`:M.write_shift(8,u[f][p]||0,`f`);break;case`N`:var P=`0`;for(typeof u[f][p]==`number`&&(P=u[f][p].toFixed(y[p]||0)),P.length>v[p]&&(P=P.slice(0,v[p])),m=0;m<v[p]-P.length;++m)M.write_shift(1,32);M.write_shift(1,P,`sbcs`);break;case`D`:u[f][p]?(M.write_shift(4,(`0000`+u[f][p].getFullYear()).slice(-4),`sbcs`),M.write_shift(2,(`00`+(u[f][p].getMonth()+1)).slice(-2),`sbcs`),M.write_shift(2,(`00`+u[f][p].getDate()).slice(-2),`sbcs`)):M.write_shift(8,`00000000`,`sbcs`);break;case`C`:var ee=M.l,F=String(u[f][p]==null?``:u[f][p]).slice(0,v[p]);for(M.write_shift(1,F,`cpstr`),ee+=v[p]-M.l,m=0;m<ee;++m)M.write_shift(1,32);break}}return E=o,s.next(1).write_shift(1,26),s.end()}return{to_workbook:i,to_sheet:r,from_sheet:o}})(),As=(function(){var e={AA:`À`,BA:`Á`,CA:`Â`,DA:195,HA:`Ä`,JA:197,AE:`È`,BE:`É`,CE:`Ê`,HE:`Ë`,AI:`Ì`,BI:`Í`,CI:`Î`,HI:`Ï`,AO:`Ò`,BO:`Ó`,CO:`Ô`,DO:213,HO:`Ö`,AU:`Ù`,BU:`Ú`,CU:`Û`,HU:`Ü`,Aa:`à`,Ba:`á`,Ca:`â`,Da:227,Ha:`ä`,Ja:229,Ae:`è`,Be:`é`,Ce:`ê`,He:`ë`,Ai:`ì`,Bi:`í`,Ci:`î`,Hi:`ï`,Ao:`ò`,Bo:`ó`,Co:`ô`,Do:245,Ho:`ö`,Au:`ù`,Bu:`ú`,Cu:`û`,Hu:`ü`,KC:`Ç`,Kc:`ç`,q:`æ`,z:`œ`,a:`Æ`,j:`Œ`,DN:209,Dn:241,Hy:255,S:169,c:170,R:174,"B ":180,0:176,1:177,2:178,3:179,5:181,6:182,7:183,Q:185,k:186,b:208,i:216,l:222,s:240,y:248,"!":161,'"':162,"#":163,"(":164,"%":165,"'":167,"H ":168,"+":171,";":187,"<":188,"=":189,">":190,"?":191,"{":223},t=RegExp(`\x1BN(`+Et(e).join(`|`).replace(/\|\|\|/,`|\\||`).replace(/([?()+])/g,`\\$1`).replace(`{`,`\\{`)+`|\\|)`,`gm`);try{t=RegExp(`\x1BN(`+Et(e).join(`|`).replace(/\|\|\|/,`|\\||`).replace(/([?()+])/g,`\\$1`)+`|\\|)`,`gm`)}catch{}var n=function(t,n){var r=e[n];return typeof r==`number`?R(r):r},r=function(e,t,n){var r=t.charCodeAt(0)-32<<4|n.charCodeAt(0)-48;return r==59?e:R(r)};e[`|`]=254;var i=function(e){return e.replace(/\n/g,`\x1B :`).replace(/\r/g,`\x1B =`)};function a(e,t){switch(t.type){case`base64`:return o(H(e),t);case`binary`:return o(e,t);case`buffer`:return o(U&&Buffer.isBuffer(e)?e.toString(`binary`):ce(e),t);case`array`:return o(Rt(e),t)}throw Error(`Unrecognized type `+t.type)}function o(e,i){var a=e.split(/[\n\r]+/),o=-1,s=-1,c=0,l=0,u=[],d=[],f=null,p={},m=[],h=[],g=[],_=0,v,y={Workbook:{WBProps:{},Names:[]}};for(+i.codepage>=0&&N(+i.codepage);c!==a.length;++c){_=0;var b=a[c].trim().replace(/\x1B([\x20-\x2F])([\x30-\x3F])/g,r).replace(t,n),x=b.replace(/;;/g,`\0`).split(`;`).map(function(e){return e.replace(/\u0000/g,`;`)}),S=x[0],C;if(b.length>0)switch(S){case`ID`:break;case`E`:break;case`B`:break;case`O`:for(l=1;l<x.length;++l)switch(x[l].charAt(0)){case`V`:var w=parseInt(x[l].slice(1),10);w>=1&&w<=4&&(y.Workbook.WBProps.date1904=!0);break}break;case`W`:break;case`P`:switch(x[1].charAt(0)){case`P`:d.push(b.slice(3).replace(/;;/g,`;`));break}break;case`NN`:var T={Sheet:0};for(l=1;l<x.length;++l)switch(x[l].charAt(0)){case`N`:T.Name=x[l].slice(1);break;case`E`:T.Ref=(i&&i.sheet||`Sheet1`)+`!`+Fl(x[l].slice(1));break}y.Workbook.Names.push(T);break;case`C`:var E=!1,D=!1,k=!1,A=!1,j=-1,M=-1,P=``,ee=`z`,F=``;for(l=1;l<x.length;++l)switch(x[l].charAt(0)){case`A`:F=x[l].slice(1);break;case`X`:s=parseInt(x[l].slice(1),10)-1,D=!0;break;case`Y`:for(o=parseInt(x[l].slice(1),10)-1,D||(s=0),v=u.length;v<=o;++v)u[v]=[];break;case`K`:C=x[l].slice(1),C.charAt(0)===`"`?(C=C.slice(1,C.length-1),ee=`s`):C===`TRUE`||C===`FALSE`?(C=C===`TRUE`,ee=`b`):C.charAt(0)==`#`&&Zi[C]!=null?(ee=`e`,C=Zi[C]):isNaN(Vt(C))||(C=Vt(C),ee=`n`,f!==null&&lt(f)&&i.cellDates&&(C=Mt(y.Workbook.WBProps.date1904?C+1462:C),ee=typeof C==`number`?`n`:`d`)),O!==void 0&&typeof C==`string`&&(i||{}).type!=`string`&&(i||{}).codepage&&(C=O.utils.decode(i.codepage,C)),E=!0;break;case`E`:A=!0,P=Fl(x[l].slice(1),{r:o,c:s});break;case`S`:k=!0;break;case`G`:break;case`R`:j=parseInt(x[l].slice(1),10)-1;break;case`C`:M=parseInt(x[l].slice(1),10)-1;break;default:if(i&&i.WTF)throw Error(`SYLK bad record `+b)}if(E&&(u[o][s]?(u[o][s].t=ee,u[o][s].v=C):u[o][s]={t:ee,v:C},f&&(u[o][s].z=f),i.cellText!==!1&&f&&(u[o][s].w=mt(u[o][s].z,u[o][s].v,{date1904:y.Workbook.WBProps.date1904})),f=null),k){if(A)throw Error(`SYLK shared formula cannot have own formula`);var I=j>-1&&u[j][M];if(!I||!I[1])throw Error(`SYLK shared formula cannot find base`);P=Rl(I[1],{r:o-j,c:s-M})}P&&(u[o][s]?u[o][s].f=P:u[o][s]={t:`n`,f:P}),F&&(u[o][s]||(u[o][s]={t:`z`}),u[o][s].c=[{a:`SheetJSYLK`,t:F}]);break;case`F`:var te=0;for(l=1;l<x.length;++l)switch(x[l].charAt(0)){case`X`:s=parseInt(x[l].slice(1),10)-1,++te;break;case`Y`:for(o=parseInt(x[l].slice(1),10)-1,v=u.length;v<=o;++v)u[v]=[];break;case`M`:_=parseInt(x[l].slice(1),10)/20;break;case`F`:break;case`G`:break;case`P`:f=d[parseInt(x[l].slice(1),10)];break;case`S`:break;case`D`:break;case`N`:break;case`W`:for(g=x[l].slice(1).split(` `),v=parseInt(g[0],10);v<=parseInt(g[1],10);++v)_=parseInt(g[2],10),h[v-1]=_===0?{hidden:!0}:{wch:_};break;case`C`:s=parseInt(x[l].slice(1),10)-1,h[s]||(h[s]={});break;case`R`:o=parseInt(x[l].slice(1),10)-1,m[o]||(m[o]={}),_>0?(m[o].hpt=_,m[o].hpx=Ic(_)):_===0&&(m[o].hidden=!0);break;default:if(i&&i.WTF)throw Error(`SYLK bad record `+b)}te<1&&(f=null);break;default:if(i&&i.WTF)throw Error(`SYLK bad record `+b)}}return m.length>0&&(p[`!rows`]=m),h.length>0&&(p[`!cols`]=h),h.forEach(function(e){Nc(e)}),i&&i.sheetRows&&(u=u.slice(0,i.sheetRows)),[u,p,y]}function s(e,t){var n=a(e,t),r=n[0],i=n[1],o=n[2],s=zt(t);s.date1904=(((o||{}).Workbook||{}).WBProps||{}).date1904;var c=di(r,s);Et(i).forEach(function(e){c[e]=i[e]});var l=ci(c,t);return Et(o).forEach(function(e){l[e]=o[e]}),l.bookType=`sylk`,l}function c(e,t,n,r,i,a){var o=`C;Y`+(n+1)+`;X`+(r+1)+`;K`;switch(e.t){case`n`:o+=isFinite(e.v)?e.v||0:Xi[isNaN(e.v)?36:7],e.f&&!e.F&&(o+=`;E`+Ll(e.f,{r:n,c:r}));break;case`b`:o+=e.v?`TRUE`:`FALSE`;break;case`e`:o+=e.w||Xi[e.v]||e.v;break;case`d`:o+=jt(Lt(e.v,a),a);break;case`s`:o+=`"`+(e.v==null?``:String(e.v)).replace(/"/g,``).replace(/;/g,`;;`)+`"`;break}return o}function l(e,t,n){var r=`C;Y`+(t+1)+`;X`+(n+1)+`;A`;return r+=i(e.map(function(e){return e.t}).join(``)),r}function u(e,t){t.forEach(function(t,n){var r=`F;W`+(n+1)+` `+(n+1)+` `;t.hidden?r+=`0`:(typeof t.width==`number`&&!t.wpx&&(t.wpx=Oc(t.width)),typeof t.wpx==`number`&&!t.wch&&(t.wch=kc(t.wpx)),typeof t.wch==`number`&&(r+=Math.round(t.wch))),r.charAt(r.length-1)!=` `&&e.push(r)})}function d(e,t){t.forEach(function(t,n){var r=`F;`;t.hidden?r+=`M0;`:t.hpt?r+=`M`+20*t.hpt+`;`:t.hpx&&(r+=`M`+20*Fc(t.hpx)+`;`),r.length>2&&e.push(r+`R`+(n+1))})}function f(e,t,n){t||={},t._formats=[`General`];var r=[`ID;PSheetJS;N;E`],i=[],a=ai(e[`!ref`]||`A1`),o,s=e[`!data`]!=null,f=`\r
`,p=(((n||{}).Workbook||{}).WBProps||{}).date1904,m=`General`;r.push(`P;PGeneral`);var h=a.s.r,g=a.s.c,_=[];if(e[`!ref`]){for(h=a.s.r;h<=a.e.r;++h)if(!(s&&!e[`!data`][h])){for(_=[],g=a.s.c;g<=a.e.c;++g)o=s?e[`!data`][h][g]:e[Xr(g)+Kr(h)],!(!o||!o.c)&&_.push(l(o.c,h,g));_.length&&i.push(_.join(f))}}if(e[`!ref`]){for(h=a.s.r;h<=a.e.r;++h)if(!(s&&!e[`!data`][h])){for(_=[],g=a.s.c;g<=a.e.c;++g)if(o=s?e[`!data`][h][g]:e[Xr(g)+Kr(h)],!(!o||o.v==null&&(!o.f||o.F))){if((o.z||(o.t==`d`?G[14]:`General`))!=m){var v=t._formats.indexOf(o.z);v==-1&&(t._formats.push(o.z),v=t._formats.length-1,r.push(`P;P`+o.z.replace(/;/g,`;;`))),_.push(`F;P`+v+`;Y`+(h+1)+`;X`+(g+1))}_.push(c(o,e,h,g,t,p))}i.push(_.join(f))}}return r.push(`F;P0;DG0G8;M255`),e[`!cols`]&&u(r,e[`!cols`]),e[`!rows`]&&d(r,e[`!rows`]),e[`!ref`]&&r.push(`B;Y`+(a.e.r-a.s.r+1)+`;X`+(a.e.c-a.s.c+1)+`;D`+[a.s.c,a.s.r,a.e.c,a.e.r].join(` `)),r.push(`O;L;D;B`+(p?`;V4`:``)+`;K47;G100 0.001`),delete t._formats,r.join(f)+f+i.join(f)+f+`E`+f}return{to_workbook:s,from_sheet:f}})(),js=(function(){function e(e,n){switch(n.type){case`base64`:return t(H(e),n);case`binary`:return t(e,n);case`buffer`:return t(U&&Buffer.isBuffer(e)?e.toString(`binary`):ce(e),n);case`array`:return t(Rt(e),n)}throw Error(`Unrecognized type `+n.type)}function t(e,t){for(var n=e.split(`
`),r=-1,i=-1,a=0,o=[];a!==n.length;++a){if(n[a].trim()===`BOT`){o[++r]=[],i=0;continue}if(!(r<0)){var s=n[a].trim().split(`,`),c=s[0],l=s[1];++a;for(var u=n[a]||``;(u.match(/["]/g)||[]).length&1&&a<n.length-1;)u+=`
`+n[++a];switch(u=u.trim(),+c){case-1:if(u===`BOT`){o[++r]=[],i=0;continue}else if(u!==`EOD`)throw Error(`Unrecognized DIF special command `+u);break;case 0:u===`TRUE`?o[r][i]=!0:u===`FALSE`?o[r][i]=!1:isNaN(Vt(l))?isNaN(Yt(l).getDate())?o[r][i]=l:(o[r][i]=Lt(l),t&&t.UTC||(o[r][i]=Zt(o[r][i]))):o[r][i]=Vt(l),++i;break;case 1:u=u.slice(1,u.length-1),u=u.replace(/""/g,`"`),B&&u&&u.match(/^=".*"$/)&&(u=u.slice(2,-1)),o[r][i++]=u===``?null:u;break}if(u===`EOD`)break}}return t&&t.sheetRows&&(o=o.slice(0,t.sheetRows)),o}function n(t,n){return di(e(t,n),n)}function r(e,t){var r=ci(n(e,t),t);return r.bookType=`dif`,r}function i(e,t){return`0,`+String(e)+`\r
`+t}function a(e){return`1,0\r
"`+e.replace(/"/g,`""`)+`"`}function o(e){var t=B;if(!e[`!ref`])throw Error(`Cannot export empty sheet to DIF`);for(var n=ai(e[`!ref`]),r=e[`!data`]!=null,o=[`TABLE\r
0,1\r
"sheetjs"\r
`,`VECTORS\r
0,`+(n.e.r-n.s.r+1)+`\r
""\r
`,`TUPLES\r
0,`+(n.e.c-n.s.c+1)+`\r
""\r
`,`DATA\r
0,0\r
""\r
`],s=n.s.r;s<=n.e.r;++s){for(var c=r?e[`!data`][s]:[],l=`-1,0\r
BOT\r
`,u=n.s.c;u<=n.e.c;++u){var d=r?c&&c[u]:e[ti({r:s,c:u})];if(d==null){l+=`1,0\r
""\r
`;continue}switch(d.t){case`n`:t?d.w==null?d.v==null?d.f!=null&&!d.F?l+=a(`=`+d.f):l+=`1,0\r
""`:l+=i(d.v,`V`):l+=`0,`+d.w+`\r
V`:d.v==null?l+=`1,0\r
""`:l+=i(d.v,`V`);break;case`b`:l+=d.v?i(1,`TRUE`):i(0,`FALSE`);break;case`s`:l+=a(!t||isNaN(+d.v)?d.v:`="`+d.v+`"`);break;case`d`:d.w||=mt(d.z||G[14],jt(Lt(d.v))),t?l+=i(d.w,`V`):l+=a(d.w);break;default:l+=`1,0\r
""`}l+=`\r
`}o.push(l)}return o.join(``)+`-1,0\r
EOD`}return{to_workbook:r,to_sheet:n,from_sheet:o}})(),Ms=(function(){function e(e){return e.replace(/\\b/g,`\\`).replace(/\\c/g,`:`).replace(/\\n/g,`
`)}function t(e){return e.replace(/\\/g,`\\b`).replace(/:/g,`\\c`).replace(/\n/g,`\\n`)}function n(t,n){for(var r=t.split(`
`),i=-1,a=-1,o=0,s=[];o!==r.length;++o){var c=r[o].trim().split(`:`);if(c[0]===`cell`){var l=ei(c[1]);if(s.length<=l.r)for(i=s.length;i<=l.r;++i)s[i]||(s[i]=[]);switch(i=l.r,a=l.c,c[2]){case`t`:s[i][a]=e(c[3]);break;case`v`:s[i][a]=+c[3];break;case`vtf`:var u=c[c.length-1];case`vtc`:switch(c[3]){case`nl`:s[i][a]=!!+c[4];break;default:s[i][a]=c[c.length-1].charAt(0)==`#`?{t:`e`,v:Zi[c[c.length-1]]}:+c[4];break}c[2]==`vtf`&&(s[i][a]=[s[i][a],u])}}}return n&&n.sheetRows&&(s=s.slice(0,n.sheetRows)),s}function r(e,t){return di(n(e,t),t)}function i(e,t){return ci(r(e,t),t)}var a=[`socialcalc:version:1.5`,`MIME-Version: 1.0`,`Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave`].join(`
`),o=[`--SocialCalcSpreadsheetControlSave`,`Content-type: text/plain; charset=UTF-8`].join(`
`)+`
`,s=[`# SocialCalc Spreadsheet Control Save`,`part:sheet`].join(`
`),c=`--SocialCalcSpreadsheetControlSave--`;function l(e){if(!e||!e[`!ref`])return``;for(var n=[],r=[],i,a=``,o=ni(e[`!ref`]),s=e[`!data`]!=null,c=o.s.r;c<=o.e.r;++c)for(var l=o.s.c;l<=o.e.c;++l)if(a=ti({r:c,c:l}),i=s?(e[`!data`][c]||[])[l]:e[a],!(!i||i.v==null||i.t===`z`)){switch(r=[`cell`,a,`t`],i.t){case`s`:r.push(t(i.v));break;case`b`:r[2]=`vt`+(i.f?`f`:`c`),r[3]=`nl`,r[4]=i.v?`1`:`0`,r[5]=t(i.f||(i.v?`TRUE`:`FALSE`));break;case`d`:var u=jt(Lt(i.v));r[2]=`vtc`,r[3]=`nd`,r[4]=``+u,r[5]=i.w||mt(i.z||G[14],u);break;case`n`:isFinite(i.v)?i.f?(r[2]=`vtf`,r[3]=`n`,r[4]=i.v,r[5]=t(i.f)):(r[2]=`v`,r[3]=i.v):(r[2]=`vt`+(i.f?`f`:`c`),r[3]=`e`+Xi[isNaN(i.v)?36:7],r[4]=`0`,r[5]=i.f||r[3].slice(1),r[6]=`e`,r[7]=r[3].slice(1));break;case`e`:continue}n.push(r.join(`:`))}return n.push(`sheet:c:`+(o.e.c-o.s.c+1)+`:r:`+(o.e.r-o.s.r+1)+`:tvf:1`),n.push(`valueformat:1:text-wiki`),n.join(`
`)}function u(e){return[a,o,s,o,l(e),c].join(`
`)}return{to_workbook:i,to_sheet:r,from_sheet:u}})(),Ns=(function(){function e(e,t,n,r,i){i.raw?t[n][r]=e:e===``||(e===`TRUE`?t[n][r]=!0:e===`FALSE`?t[n][r]=!1:isNaN(Vt(e))?isNaN(Yt(e).getDate())?e.charCodeAt(0)==35&&Zi[e]!=null?t[n][r]={t:`e`,v:Zi[e],w:e}:t[n][r]=e:t[n][r]=Lt(e):t[n][r]=Vt(e))}function t(t,n){var r=n||{},i=[];if(!t||t.length===0)return i;for(var a=t.split(/[\r\n]/),o=a.length-1;o>=0&&a[o].length===0;)--o;for(var s=10,c=0,l=0;l<=o;++l)c=a[l].indexOf(` `),c==-1?c=a[l].length:c++,s=Math.max(s,c);for(l=0;l<=o;++l){i[l]=[];var u=0;for(e(a[l].slice(0,s).trim(),i,l,u,r),u=1;u<=(a[l].length-s)/10+1;++u)e(a[l].slice(s+(u-1)*10,s+u*10).trim(),i,l,u,r)}return r.sheetRows&&(i=i.slice(0,r.sheetRows)),i}var n={44:`,`,9:`	`,59:`;`,124:`|`},r={44:3,9:2,59:1,124:0};function i(e){for(var t={},i=!1,a=0,o=0;a<e.length;++a)(o=e.charCodeAt(a))==34?i=!i:!i&&o in n&&(t[o]=(t[o]||0)+1);for(a in o=[],t)Object.prototype.hasOwnProperty.call(t,a)&&o.push([t[a],a]);if(!o.length)for(a in t=r,t)Object.prototype.hasOwnProperty.call(t,a)&&o.push([t[a],a]);return o.sort(function(e,t){return e[0]-t[0]||r[e[1]]-r[t[1]]}),n[o.pop()[1]]||44}function a(e,t){var n=t||{},r=``;z!=null&&n.dense==null&&(n.dense=z);var a={};n.dense&&(a[`!data`]=[]);var o={s:{c:0,r:0},e:{c:0,r:0}};e.slice(0,4)==`sep=`?e.charCodeAt(5)==13&&e.charCodeAt(6)==10?(r=e.charAt(4),e=e.slice(7)):e.charCodeAt(5)==13||e.charCodeAt(5)==10?(r=e.charAt(4),e=e.slice(6)):r=i(e.slice(0,1024)):r=n&&n.FS?n.FS:i(e.slice(0,1024));var s=0,c=0,l=0,u=0,d=0,f=r.charCodeAt(0),p=!1,m=0,h=e.charCodeAt(0),g=n.dateNF==null?null:yt(n.dateNF);function _(){var t=e.slice(u,d);t.slice(-1)==`\r`&&(t=t.slice(0,-1));var r={};if(t.charAt(0)==`"`&&t.charAt(t.length-1)==`"`&&(t=t.slice(1,-1).replace(/""/g,`"`)),n.cellText!==!1&&(r.w=t),t.length===0?r.t=`z`:n.raw||t.trim().length===0?(r.t=`s`,r.v=t):t.charCodeAt(0)==61?t.charCodeAt(1)==34&&t.charCodeAt(t.length-1)==34?(r.t=`s`,r.v=t.slice(2,-1).replace(/""/g,`"`)):Bl(t)?(r.t=`s`,r.f=t.slice(1),r.v=t):(r.t=`s`,r.v=t):t==`TRUE`?(r.t=`b`,r.v=!0):t==`FALSE`?(r.t=`b`,r.v=!1):isNaN(l=Vt(t))?!isNaN((l=Yt(t)).getDate())||g&&t.match(g)?(r.z=n.dateNF||G[14],g&&t.match(g)?(l=Lt(bt(t,n.dateNF,t.match(g)||[])),n&&n.UTC===!1&&(l=Zt(l))):n&&n.UTC===!1?l=Zt(l):n.cellText!==!1&&n.dateNF&&(r.w=mt(r.z,l)),n.cellDates?(r.t=`d`,r.v=l):(r.t=`n`,r.v=jt(l)),n.cellNF||delete r.z):t.charCodeAt(0)==35&&Zi[t]!=null?(r.t=`e`,r.w=t,r.v=Zi[t]):(r.t=`s`,r.v=t):(r.t=`n`,r.v=l),r.t==`z`||(n.dense?(a[`!data`][s]||(a[`!data`][s]=[]),a[`!data`][s][c]=r):a[ti({c,r:s})]=r),u=d+1,h=e.charCodeAt(u),o.e.c<c&&(o.e.c=c),o.e.r<s&&(o.e.r=s),m==f)++c;else if(c=0,++s,n.sheetRows&&n.sheetRows<=s)return!0}outer:for(;d<e.length;++d)switch(m=e.charCodeAt(d)){case 34:h===34&&(p=!p);break;case 13:if(p)break;e.charCodeAt(d+1)==10&&++d;case f:case 10:if(!p&&_())break outer;break;default:break}return d-u>0&&_(),a[`!ref`]=ri(o),a}function o(e,n){return!(n&&n.PRN)||n.FS||e.slice(0,4)==`sep=`||e.indexOf(`	`)>=0||e.indexOf(`,`)>=0||e.indexOf(`;`)>=0?a(e,n):di(t(e,n),n)}function s(e,t){var n=``,r=t.type==`string`?[0,0,0,0]:Vm(e,t);switch(t.type){case`base64`:n=H(e);break;case`binary`:n=e;break;case`buffer`:n=t.codepage==65001?e.toString(`utf8`):t.codepage&&O!==void 0?O.utils.decode(t.codepage,e):U&&Buffer.isBuffer(e)?e.toString(`binary`):ce(e);break;case`array`:n=Rt(e);break;case`string`:n=e;break;default:throw Error(`Unrecognized type `+t.type)}return r[0]==239&&r[1]==187&&r[2]==191?n=Vn(n.slice(3)):t.type!=`string`&&t.type!=`buffer`&&t.codepage==65001?n=Vn(n):t.type==`binary`&&O!==void 0&&t.codepage&&(n=O.utils.decode(t.codepage,O.utils.encode(28591,n))),n.slice(0,19)==`socialcalc:version:`?Ms.to_sheet(t.type==`string`?n:Vn(n),t):o(n,t)}function c(e,t){return ci(s(e,t),t)}function l(e){var t=[];if(!e[`!ref`])return``;for(var n=ai(e[`!ref`]),r,i=e[`!data`]!=null,a=n.s.r;a<=n.e.r;++a){for(var o=[],s=n.s.c;s<=n.e.c;++s){var c=ti({r:a,c:s});if(r=i?(e[`!data`][a]||[])[s]:e[c],!r||r.v==null){o.push(`          `);continue}for(var l=(r.w||(si(r),r.w)||``).slice(0,10);l.length<10;)l+=` `;o.push(l+(s===0?` `:``))}t.push(o.join(``))}return t.join(`
`)}return{to_workbook:c,to_sheet:s,from_sheet:l}})();function Ps(e,t){var n=t||{},r=!!n.WTF;n.WTF=!0;try{var i=As.to_workbook(e,n);return n.WTF=r,i}catch(i){if(n.WTF=r,i.message.indexOf(`SYLK bad record ID`)==-1&&r)throw i;return Ns.to_workbook(e,t)}}var Fs=(function(){function e(e,t,n){if(e){Ir(e,e.l||0);for(var r=n.Enum||L;e.l<e.length;){var i=e.read_shift(2),a=r[i]||r[65535],o=e.read_shift(2),s=e.l+o,c=a.f&&a.f(e,o,n);if(e.l=s,t(c,a,i))return}}}function t(e,t){switch(t.type){case`base64`:return r(se(H(e)),t);case`binary`:return r(se(e),t);case`buffer`:case`array`:return r(e,t)}throw`Unsupported type `+t.type}var n=[`mmmm`,`dd-mmm-yyyy`,`dd-mmm`,`mmm-yyyy`,`@`,`mm/dd`,`hh:mm:ss AM/PM`,`hh:mm AM/PM`,`mm/dd/yyyy`,`mm/dd`,`hh:mm:ss`,`hh:mm`];function r(t,r){if(!t)return t;var i=r||{};z!=null&&i.dense==null&&(i.dense=z);var a={},o=`Sheet1`,s=``,c=0,l={},u=[],d=[],f=[];i.dense&&(f=a[`!data`]=[]);var p={s:{r:0,c:0},e:{r:0,c:0}},m=i.sheetRows||0,h={};if(t[4]==81&&t[5]==80&&t[6]==87)return re(t,r);if(t[2]==0&&(t[3]==8||t[3]==9)&&t.length>=16&&t[14]==5&&t[15]===108)throw Error(`Unsupported Works 3 for Mac file`);if(t[2]==2)i.Enum=L,e(t,function(e,t,r){switch(r){case 0:i.vers=e,e>=4096&&(i.qpro=!0);break;case 255:i.vers=e,i.works=!0;break;case 6:p=e;break;case 204:e&&(s=e);break;case 222:s=e;break;case 15:case 51:(!i.qpro&&!i.works||r==51)&&e[1].v.charCodeAt(0)<48&&(e[1].v=e[1].v.slice(1)),(i.works||i.works2)&&(e[1].v=e[1].v.replace(/\r\n/g,`
`));case 13:case 14:case 16:(e[2]&112)==112&&(e[2]&15)>1&&(e[2]&15)<15&&(e[1].z=i.dateNF||n[(e[2]&15)-1]||G[14],i.cellDates&&(e[1].v=Mt(e[1].v),e[1].t=typeof e[1].v==`number`?`n`:`d`)),i.qpro&&e[3]>c&&(a[`!ref`]=ri(p),l[o]=a,u.push(o),a={},i.dense&&(f=a[`!data`]=[]),p={s:{r:0,c:0},e:{r:0,c:0}},c=e[3],o=s||`Sheet`+(c+1),s=``);var d=i.dense?(f[e[0].r]||[])[e[0].c]:a[ti(e[0])];if(d){d.t=e[1].t,d.v=e[1].v,e[1].z!=null&&(d.z=e[1].z),e[1].f!=null&&(d.f=e[1].f),h=d;break}i.dense?(f[e[0].r]||(f[e[0].r]=[]),f[e[0].r][e[0].c]=e[1]):a[ti(e[0])]=e[1],h=e[1];break;case 21509:i.works2=!0;break;case 21506:e==5281&&(h.z=`hh:mm:ss`,i.cellDates&&h.t==`n`&&(h.v=Mt(h.v),h.t=typeof h.v==`number`?`n`:`d`));break}},i);else if(t[2]==26||t[2]==14)i.Enum=R,t[2]==14&&(i.qpro=!0,t.l=0),e(t,function(e,t,n){switch(n){case 204:o=e;break;case 22:e[1].v.charCodeAt(0)<48&&(e[1].v=e[1].v.slice(1)),e[1].v=e[1].v.replace(/\x0F./g,function(e){return String.fromCharCode(e.charCodeAt(1)-32)}).replace(/\r\n/g,`
`);case 23:case 24:case 25:case 37:case 39:case 40:if(e[3]>c&&(a[`!ref`]=ri(p),l[o]=a,u.push(o),a={},i.dense&&(f=a[`!data`]=[]),p={s:{r:0,c:0},e:{r:0,c:0}},c=e[3],o=`Sheet`+(c+1)),m>0&&e[0].r>=m)break;i.dense?(f[e[0].r]||(f[e[0].r]=[]),f[e[0].r][e[0].c]=e[1]):a[ti(e[0])]=e[1],p.e.c<e[0].c&&(p.e.c=e[0].c),p.e.r<e[0].r&&(p.e.r=e[0].r);break;case 27:e[14e3]&&(d[e[14e3][0]]=e[14e3][1]);break;case 1537:d[e[0]]=e[1],e[0]==c&&(o=e[1]);break;default:break}},i);else throw Error(`Unrecognized LOTUS BOF `+t[2]);if(a[`!ref`]=ri(p),l[s||o]=a,u.push(s||o),!d.length)return{SheetNames:u,Sheets:l};for(var g={},_=[],v=0;v<d.length;++v)l[u[v]]?(_.push(d[v]||u[v]),g[d[v]]=l[d[v]]||l[u[v]]):(_.push(d[v]),g[d[v]]={"!ref":`A1`});return{SheetNames:_,Sheets:g}}function i(e,t){var n=t||{};if(+n.codepage>=0&&N(+n.codepage),n.type==`string`)throw Error(`Cannot write WK1 to JS string`);var r=Br();if(!e[`!ref`])throw Error(`Cannot export empty sheet to WK1`);var i=ai(e[`!ref`]),a=e[`!data`]!=null,s=[];zp(r,0,o(1030)),zp(r,6,l(i));for(var c=Math.min(i.e.r,8191),u=i.s.c;u<=i.e.c;++u)s[u]=Xr(u);for(var d=i.s.r;d<=c;++d){var f=Kr(d);for(u=i.s.c;u<=i.e.c;++u){var m=a?(e[`!data`][d]||[])[u]:e[s[u]+f];if(!(!m||m.t==`z`))switch(m.t){case`n`:(m.v|0)==m.v&&m.v>=-32768&&m.v<=32767?zp(r,13,g(d,u,m)):zp(r,14,v(d,u,m));break;case`d`:var h=jt(m.v);(h|0)==h&&h>=-32768&&h<=32767?zp(r,13,g(d,u,{t:`n`,v:h,z:m.z||G[14]})):zp(r,14,v(d,u,{t:`n`,v:h,z:m.z||G[14]}));break;default:var _=si(m);zp(r,15,p(d,u,_.slice(0,239)))}}}return zp(r,1),r.end()}function a(e,t){var n=t||{};if(+n.codepage>=0&&N(+n.codepage),n.type==`string`)throw Error(`Cannot write WK3 to JS string`);var r=Br();zp(r,0,s(e));for(var i=0,a=0;i<e.SheetNames.length;++i)(e.Sheets[e.SheetNames[i]]||{})[`!ref`]&&zp(r,27,ne(e.SheetNames[i],a++));var o=0;for(i=0;i<e.SheetNames.length;++i){var c=e.Sheets[e.SheetNames[i]];if(!(!c||!c[`!ref`])){for(var l=ai(c[`!ref`]),u=c[`!data`]!=null,d=[],f=Math.min(l.e.r,8191),p=l.s.r;p<=f;++p)for(var m=Kr(p),h=l.s.c;h<=l.e.c;++h){p===l.s.r&&(d[h]=Xr(h));var g=d[h]+m,_=u?(c[`!data`][p]||[])[h]:c[g];if(!(!_||_.t==`z`))if(_.t==`n`)zp(r,23,k(p,h,o,_.v));else{var v=si(_);zp(r,22,E(p,h,o,v.slice(0,239)))}}++o}}return zp(r,1),r.end()}function o(e){var t=Rr(2);return t.write_shift(2,e),t}function s(e){var t=Rr(26);t.write_shift(2,4096),t.write_shift(2,4),t.write_shift(4,0);for(var n=0,r=0,i=0,a=0;a<e.SheetNames.length;++a){var o=e.SheetNames[a],s=e.Sheets[o];if(!(!s||!s[`!ref`])){++i;var c=ni(s[`!ref`]);n<c.e.r&&(n=c.e.r),r<c.e.c&&(r=c.e.c)}}return n>8191&&(n=8191),t.write_shift(2,n),t.write_shift(1,i),t.write_shift(1,r),t.write_shift(2,0),t.write_shift(2,0),t.write_shift(1,1),t.write_shift(1,2),t.write_shift(4,0),t.write_shift(4,0),t}function c(e,t,n){var r={s:{c:0,r:0},e:{c:0,r:0}};return t==8&&n.qpro?(r.s.c=e.read_shift(1),e.l++,r.s.r=e.read_shift(2),r.e.c=e.read_shift(1),e.l++,r.e.r=e.read_shift(2),r):(r.s.c=e.read_shift(2),r.s.r=e.read_shift(2),t==12&&n.qpro&&(e.l+=2),r.e.c=e.read_shift(2),r.e.r=e.read_shift(2),t==12&&n.qpro&&(e.l+=2),r.s.c==65535&&(r.s.c=r.e.c=r.s.r=r.e.r=0),r)}function l(e){var t=Rr(8);return t.write_shift(2,e.s.c),t.write_shift(2,e.s.r),t.write_shift(2,e.e.c),t.write_shift(2,e.e.r),t}function u(e,t,n){var r=[{c:0,r:0},{t:`n`,v:0},0,0];return n.qpro&&n.vers!=20768?(r[0].c=e.read_shift(1),r[3]=e.read_shift(1),r[0].r=e.read_shift(2),e.l+=2):n.works?(r[0].c=e.read_shift(2),r[0].r=e.read_shift(2),r[2]=e.read_shift(2)):(r[2]=e.read_shift(1),r[0].c=e.read_shift(2),r[0].r=e.read_shift(2)),r}function d(e){return e.z&&lt(e.z)?240|(n.indexOf(e.z)+1||2):255}function f(e,t,n){var r=e.l+t,i=u(e,t,n);if(i[1].t=`s`,(n.vers&65534)==20768){e.l++;var a=e.read_shift(1);return i[1].v=e.read_shift(a,`utf8`),i}return n.qpro&&e.l++,i[1].v=e.read_shift(r-e.l,`cstr`),i}function p(e,t,n){var r=Rr(7+n.length);r.write_shift(1,255),r.write_shift(2,t),r.write_shift(2,e),r.write_shift(1,39);for(var i=0;i<r.length;++i){var a=n.charCodeAt(i);r.write_shift(1,a>=128?95:a)}return r.write_shift(1,0),r}function m(e,t,n){var r=e.l+t,i=u(e,t,n);if(i[1].t=`s`,n.vers==20768){var a=e.read_shift(1);return i[1].v=e.read_shift(a,`utf8`),i}return i[1].v=e.read_shift(r-e.l,`cstr`),i}function h(e,t,n){var r=u(e,t,n);return r[1].v=e.read_shift(2,`i`),r}function g(e,t,n){var r=Rr(7);return r.write_shift(1,d(n)),r.write_shift(2,t),r.write_shift(2,e),r.write_shift(2,n.v,`i`),r}function _(e,t,n){var r=u(e,t,n);return r[1].v=e.read_shift(8,`f`),r}function v(e,t,n){var r=Rr(13);return r.write_shift(1,d(n)),r.write_shift(2,t),r.write_shift(2,e),r.write_shift(8,n.v,`f`),r}function y(e,t,n){var r=e.l+t,i=u(e,t,n);if(i[1].v=e.read_shift(8,`f`),n.qpro)e.l=r;else{var a=e.read_shift(2);C(e.slice(e.l,e.l+a),i),e.l+=a}return i}function b(e,t,n){var r=t&32768;return t&=-32769,t=(r?e:0)+(t>=8192?t-16384:t),(r?``:`$`)+(n?Xr(t):Kr(t))}var x={31:[`NA`,0],33:[`ABS`,1],34:[`TRUNC`,1],35:[`SQRT`,1],36:[`LOG`,1],37:[`LN`,1],38:[`PI`,0],39:[`SIN`,1],40:[`COS`,1],41:[`TAN`,1],42:[`ATAN2`,2],43:[`ATAN`,1],44:[`ASIN`,1],45:[`ACOS`,1],46:[`EXP`,1],47:[`MOD`,2],49:[`ISNA`,1],50:[`ISERR`,1],51:[`FALSE`,0],52:[`TRUE`,0],53:[`RAND`,0],54:[`DATE`,3],63:[`ROUND`,2],64:[`TIME`,3],68:[`ISNUMBER`,1],69:[`ISTEXT`,1],70:[`LEN`,1],71:[`VALUE`,1],73:[`MID`,3],74:[`CHAR`,1],80:[`SUM`,69],81:[`AVERAGEA`,69],82:[`COUNTA`,69],83:[`MINA`,69],84:[`MAXA`,69],102:[`UPPER`,1],103:[`LOWER`,1],107:[`PROPER`,1],109:[`TRIM`,1],111:[`T`,1]},S=`.........+.-.*./.^.=.<>.<=.>=.<.>.....&.......`.split(`.`);function C(e,t){Ir(e,0);for(var n=[],r=0,i=``,a=``,o=``,s=``;e.l<e.length;){var c=e[e.l++];switch(c){case 0:n.push(e.read_shift(8,`f`));break;case 1:a=b(t[0].c,e.read_shift(2),!0),i=b(t[0].r,e.read_shift(2),!1),n.push(a+i);break;case 2:var l=b(t[0].c,e.read_shift(2),!0),u=b(t[0].r,e.read_shift(2),!1);a=b(t[0].c,e.read_shift(2),!0),i=b(t[0].r,e.read_shift(2),!1),n.push(l+u+`:`+a+i);break;case 3:if(e.l<e.length){console.error(`WK1 premature formula end`);return}break;case 4:n.push(`(`+n.pop()+`)`);break;case 5:n.push(e.read_shift(2));break;case 6:for(var d=``;c=e[e.l++];)d+=String.fromCharCode(c);n.push(`"`+d.replace(/"/g,`""`)+`"`);break;case 8:n.push(`-`+n.pop());break;case 23:n.push(`+`+n.pop());break;case 22:n.push(`NOT(`+n.pop()+`)`);break;case 20:case 21:s=n.pop(),o=n.pop(),n.push([`AND`,`OR`][c-20]+`(`+o+`,`+s+`)`);break;default:if(c<32&&S[c])s=n.pop(),o=n.pop(),n.push(o+S[c]+s);else if(x[c]){if(r=x[c][1],r==69&&(r=e[e.l++]),r>n.length){console.error(`WK1 bad formula parse 0x`+c.toString(16)+`:|`+n.join(`|`)+`|`);return}var f=n.slice(-r);n.length-=r,n.push(x[c][0]+`(`+f.join(`,`)+`)`)}else if(c<=7)return console.error(`WK1 invalid opcode `+c.toString(16));else if(c<=24)return console.error(`WK1 unsupported op `+c.toString(16));else if(c<=30)return console.error(`WK1 invalid opcode `+c.toString(16));else if(c<=115)return console.error(`WK1 unsupported function opcode `+c.toString(16));else return console.error(`WK1 unrecognized opcode `+c.toString(16))}}n.length==1?t[1].f=``+n[0]:console.error(`WK1 bad formula parse |`+n.join(`|`)+`|`)}function w(e){var t=[{c:0,r:0},{t:`n`,v:0},0];return t[0].r=e.read_shift(2),t[3]=e[e.l++],t[0].c=e[e.l++],t}function T(e,t){var n=w(e,t);return n[1].t=`s`,n[1].v=e.read_shift(t-4,`cstr`),n}function E(e,t,n,r){var i=Rr(6+r.length);i.write_shift(2,e),i.write_shift(1,n),i.write_shift(1,t),i.write_shift(1,39);for(var a=0;a<r.length;++a){var o=r.charCodeAt(a);i.write_shift(1,o>=128?95:o)}return i.write_shift(1,0),i}function D(e,t){var n=w(e,t);n[1].v=e.read_shift(2);var r=n[1].v>>1;if(n[1].v&1)switch(r&7){case 0:r=(r>>3)*5e3;break;case 1:r=(r>>3)*500;break;case 2:r=(r>>3)/20;break;case 3:r=(r>>3)/200;break;case 4:r=(r>>3)/2e3;break;case 5:r=(r>>3)/2e4;break;case 6:r=(r>>3)/16;break;case 7:r=(r>>3)/64;break}return n[1].v=r,n}function O(e,t){var n=w(e,t),r=e.read_shift(4),i=e.read_shift(4),a=e.read_shift(2);if(a==65535)return r===0&&i===3221225472?(n[1].t=`e`,n[1].v=15):r===0&&i===3489660928?(n[1].t=`e`,n[1].v=42):n[1].v=0,n;var o=a&32768;return a=(a&32767)-16446,n[1].v=(1-o*2)*(i*2**(a+32)+r*2**a),n}function k(e,t,n,r){var i=Rr(14);if(i.write_shift(2,e),i.write_shift(1,n),i.write_shift(1,t),r==0)return i.write_shift(4,0),i.write_shift(4,0),i.write_shift(2,65535),i;var a=0,o=0,s=0,c=0;return r<0&&(a=1,r=-r),o=Math.log2(r)|0,r/=2**(o-31),c=r>>>0,c&2147483648||(r/=2,++o,c=r>>>0),r-=c,c|=2147483648,c>>>=0,r*=2**32,s=r>>>0,i.write_shift(4,s),i.write_shift(4,c),o+=16383+(a?32768:0),i.write_shift(2,o),i}function A(e,t){var n=O(e,14);return e.l+=t-14,n}function j(e,t){var n=w(e,t),r=e.read_shift(4);return n[1].v=r>>6,n}function M(e,t){var n=w(e,t),r=e.read_shift(8,`f`);return n[1].v=r,n}function P(e,t){var n=M(e,12);return e.l+=t-12,n}function ee(e,t){return e[e.l+t-1]==0?e.read_shift(t,`cstr`):``}function F(e,t){var n=e[e.l++];n>t-1&&(n=t-1);for(var r=``;r.length<n;)r+=String.fromCharCode(e[e.l++]);return r}function I(e,t,n){if(!(!n.qpro||t<21)){var r=e.read_shift(1);return e.l+=17,e.l+=1,e.l+=2,[r,e.read_shift(t-21,`cstr`)]}}function te(e,t){for(var n={},r=e.l+t;e.l<r;){var i=e.read_shift(2);if(i==14e3){for(n[i]=[0,``],n[i][0]=e.read_shift(2);e[e.l];)n[i][1]+=String.fromCharCode(e[e.l]),e.l++;e.l++}}return n}function ne(e,t){var n=Rr(5+e.length);n.write_shift(2,14e3),n.write_shift(2,t);for(var r=0;r<e.length;++r){var i=e.charCodeAt(r);n[n.l++]=i>127?95:i}return n[n.l++]=0,n}var L={0:{n:`BOF`,f:Ia},1:{n:`EOF`},2:{n:`CALCMODE`},3:{n:`CALCORDER`},4:{n:`SPLIT`},5:{n:`SYNC`},6:{n:`RANGE`,f:c},7:{n:`WINDOW1`},8:{n:`COLW1`},9:{n:`WINTWO`},10:{n:`COLW2`},11:{n:`NAME`},12:{n:`BLANK`},13:{n:`INTEGER`,f:h},14:{n:`NUMBER`,f:_},15:{n:`LABEL`,f},16:{n:`FORMULA`,f:y},24:{n:`TABLE`},25:{n:`ORANGE`},26:{n:`PRANGE`},27:{n:`SRANGE`},28:{n:`FRANGE`},29:{n:`KRANGE1`},32:{n:`HRANGE`},35:{n:`KRANGE2`},36:{n:`PROTEC`},37:{n:`FOOTER`},38:{n:`HEADER`},39:{n:`SETUP`},40:{n:`MARGINS`},41:{n:`LABELFMT`},42:{n:`TITLES`},43:{n:`SHEETJS`},45:{n:`GRAPH`},46:{n:`NGRAPH`},47:{n:`CALCCOUNT`},48:{n:`UNFORMATTED`},49:{n:`CURSORW12`},50:{n:`WINDOW`},51:{n:`STRING`,f:m},55:{n:`PASSWORD`},56:{n:`LOCKED`},60:{n:`QUERY`},61:{n:`QUERYNAME`},62:{n:`PRINT`},63:{n:`PRINTNAME`},64:{n:`GRAPH2`},65:{n:`GRAPHNAME`},66:{n:`ZOOM`},67:{n:`SYMSPLIT`},68:{n:`NSROWS`},69:{n:`NSCOLS`},70:{n:`RULER`},71:{n:`NNAME`},72:{n:`ACOMM`},73:{n:`AMACRO`},74:{n:`PARSE`},102:{n:`PRANGES??`},103:{n:`RRANGES??`},104:{n:`FNAME??`},105:{n:`MRANGES??`},204:{n:`SHEETNAMECS`,f:ee},222:{n:`SHEETNAMELP`,f:F},255:{n:`BOF`,f:Ia},21506:{n:`WKSNF`,f:Ia},65535:{n:``}},R={0:{n:`BOF`},1:{n:`EOF`},2:{n:`PASSWORD`},3:{n:`CALCSET`},4:{n:`WINDOWSET`},5:{n:`SHEETCELLPTR`},6:{n:`SHEETLAYOUT`},7:{n:`COLUMNWIDTH`},8:{n:`HIDDENCOLUMN`},9:{n:`USERRANGE`},10:{n:`SYSTEMRANGE`},11:{n:`ZEROFORCE`},12:{n:`SORTKEYDIR`},13:{n:`FILESEAL`},14:{n:`DATAFILLNUMS`},15:{n:`PRINTMAIN`},16:{n:`PRINTSTRING`},17:{n:`GRAPHMAIN`},18:{n:`GRAPHSTRING`},19:{n:`??`},20:{n:`ERRCELL`},21:{n:`NACELL`},22:{n:`LABEL16`,f:T},23:{n:`NUMBER17`,f:O},24:{n:`NUMBER18`,f:D},25:{n:`FORMULA19`,f:A},26:{n:`FORMULA1A`},27:{n:`XFORMAT`,f:te},28:{n:`DTLABELMISC`},29:{n:`DTLABELCELL`},30:{n:`GRAPHWINDOW`},31:{n:`CPA`},32:{n:`LPLAUTO`},33:{n:`QUERY`},34:{n:`HIDDENSHEET`},35:{n:`??`},37:{n:`NUMBER25`,f:j},38:{n:`??`},39:{n:`NUMBER27`,f:M},40:{n:`FORMULA28`,f:P},142:{n:`??`},147:{n:`??`},150:{n:`??`},151:{n:`??`},152:{n:`??`},153:{n:`??`},154:{n:`??`},155:{n:`??`},156:{n:`??`},163:{n:`??`},174:{n:`??`},175:{n:`??`},176:{n:`??`},177:{n:`??`},184:{n:`??`},185:{n:`??`},186:{n:`??`},187:{n:`??`},188:{n:`??`},195:{n:`??`},201:{n:`??`},204:{n:`SHEETNAMECS`,f:ee},205:{n:`??`},206:{n:`??`},207:{n:`??`},208:{n:`??`},256:{n:`??`},259:{n:`??`},260:{n:`??`},261:{n:`??`},262:{n:`??`},263:{n:`??`},265:{n:`??`},266:{n:`??`},267:{n:`??`},268:{n:`??`},270:{n:`??`},271:{n:`??`},384:{n:`??`},389:{n:`??`},390:{n:`??`},393:{n:`??`},396:{n:`??`},512:{n:`??`},514:{n:`??`},513:{n:`??`},516:{n:`??`},517:{n:`??`},640:{n:`??`},641:{n:`??`},642:{n:`??`},643:{n:`??`},644:{n:`??`},645:{n:`??`},646:{n:`??`},647:{n:`??`},648:{n:`??`},658:{n:`??`},659:{n:`??`},660:{n:`??`},661:{n:`??`},662:{n:`??`},665:{n:`??`},666:{n:`??`},768:{n:`??`},772:{n:`??`},1537:{n:`SHEETINFOQP`,f:I},1600:{n:`??`},1602:{n:`??`},1793:{n:`??`},1794:{n:`??`},1795:{n:`??`},1796:{n:`??`},1920:{n:`??`},2048:{n:`??`},2049:{n:`??`},2052:{n:`??`},2688:{n:`??`},10998:{n:`??`},12849:{n:`??`},28233:{n:`??`},28484:{n:`??`},65535:{n:``}},B={5:`dd-mmm-yy`,6:`dd-mmm`,7:`mmm-yy`,8:`mm/dd/yy`,10:`hh:mm:ss AM/PM`,11:`hh:mm AM/PM`,14:`dd-mmm-yyyy`,15:`mmm-yyyy`,34:`0.00`,50:`0.00;[Red]0.00`,66:`0.00;(0.00)`,82:`0.00;[Red](0.00)`,162:`"$"#,##0.00;\\("$"#,##0.00\\)`,288:`0%`,304:`0E+00`,320:`# ?/?`};function V(e){var t=e.read_shift(2),n=e.read_shift(1);if(n!=0)throw`unsupported QPW string type `+n.toString(16);return e.read_shift(t,`sbcs-cont`)}function re(e,t){Ir(e,0);var n=t||{};z!=null&&n.dense==null&&(n.dense=z);var r={};n.dense&&(r[`!data`]=[]);var i=[],a=``,o={s:{r:-1,c:-1},e:{r:-1,c:-1}},s=0,c=0,l=0,u=0,d={SheetNames:[],Sheets:{}},f=[];outer:for(;e.l<e.length;){var p=e.read_shift(2),m=e.read_shift(2),h=e.slice(e.l,e.l+m);switch(Ir(h,0),p){case 1:if(h.read_shift(4)!=962023505)throw`Bad QPW9 BOF!`;break;case 2:break outer;case 8:break;case 10:for(var g=h.read_shift(4),_=(h.length-h.l)/g|0,v=0;v<g;++v){var y=h.l+_,b={};h.l+=2,b.numFmtId=h.read_shift(2),B[b.numFmtId]&&(b.z=B[b.numFmtId]),h.l=y,f.push(b)}break;case 1025:break;case 1026:break;case 1031:for(h.l+=12;h.l<h.length;)s=h.read_shift(2),c=h.read_shift(1),i.push(h.read_shift(s,`cstr`));break;case 1032:break;case 1537:var x=h.read_shift(2);r={},n.dense&&(r[`!data`]=[]),o.s.c=h.read_shift(2),o.e.c=h.read_shift(2),o.s.r=h.read_shift(4),o.e.r=h.read_shift(4),h.l+=4,h.l+2<h.length&&(s=h.read_shift(2),c=h.read_shift(1),a=s==0?``:h.read_shift(s,`cstr`)),a||=Xr(x);break;case 1538:if(o.s.c>255||o.s.r>999999)break;o.e.c<o.s.c&&(o.e.c=o.s.c),o.e.r<o.s.r&&(o.e.r=o.s.r),r[`!ref`]=ri(o),ch(d,r,a);break;case 2561:l=h.read_shift(2),o.e.c<l&&(o.e.c=l),o.s.c>l&&(o.s.c=l),u=h.read_shift(4),o.s.r>u&&(o.s.r=u),u=h.read_shift(4),o.e.r<u&&(o.e.r=u);break;case 3073:u=h.read_shift(4),s=h.read_shift(4),o.s.r>u&&(o.s.r=u),o.e.r<u+s-1&&(o.e.r=u+s-1);for(var S=Xr(l);h.l<h.length;){var C={t:`z`},w=h.read_shift(1),T=-1;w&128&&(T=h.read_shift(2));var E=w&64?h.read_shift(2)-1:0;switch(w&31){case 0:break;case 1:break;case 2:C={t:`n`,v:h.read_shift(2)};break;case 3:C={t:`n`,v:h.read_shift(2,`i`)};break;case 4:C={t:`n`,v:Ci(h)};break;case 5:C={t:`n`,v:h.read_shift(8,`f`)};break;case 7:C={t:`s`,v:i[c=h.read_shift(4)-1]};break;case 8:C={t:`n`,v:h.read_shift(8,`f`)},h.l+=2,h.l+=4,isNaN(C.v)&&(C={t:`e`,v:15});break;default:throw`Unrecognized QPW cell type `+(w&31)}T!=-1&&(f[T-1]||{}).z&&(C.z=f[T-1].z);var D=0;if(w&32)switch(w&31){case 2:D=h.read_shift(2);break;case 3:D=h.read_shift(2,`i`);break;case 7:D=h.read_shift(2);break;default:throw`Unsupported delta for QPW cell type `+(w&31)}if(!(!n.sheetStubs&&C.t==`z`)){var O=zt(C);C.t==`n`&&C.z&&lt(C.z)&&n.cellDates&&(O.v=Mt(C.v),O.t=typeof O.v==`number`?`n`:`d`),r[`!data`]==null?r[S+Kr(u)]=O:(r[`!data`][u]||(r[`!data`][u]=[]),r[`!data`][u][l]=O)}for(++u,--s;E-->0&&s>=0;){if(w&32)switch(w&31){case 2:C={t:`n`,v:C.v+D&65535};break;case 3:C={t:`n`,v:C.v+D&65535},C.v>32767&&(C.v-=65536);break;case 7:C={t:`s`,v:i[c=c+D>>>0]};break;default:throw`Cannot apply delta for QPW cell type `+(w&31)}else switch(w&31){case 1:C={t:`z`};break;case 2:C={t:`n`,v:h.read_shift(2)};break;case 7:C={t:`s`,v:i[c=h.read_shift(4)-1]};break;default:throw`Cannot apply repeat for QPW cell type `+(w&31)}!n.sheetStubs&&C.t==`z`||(r[`!data`]==null?r[S+Kr(u)]=C:(r[`!data`][u]||(r[`!data`][u]=[]),r[`!data`][u][l]=C)),++u,--s}}break;case 3074:l=h.read_shift(2),u=h.read_shift(4);var k=V(h);r[`!data`]==null?r[Xr(l)+Kr(u)]={t:`s`,v:k}:(r[`!data`][u]||(r[`!data`][u]=[]),r[`!data`][u][l]={t:`s`,v:k});break;default:break}e.l+=m}return d}return{sheet_to_wk1:i,book_to_wk3:a,to_workbook:t}})();function Is(e){var t={},n=e.match(wn),r=0,i=!1;if(n)for(;r!=n.length;++r){var a=q(n[r]);switch(a[0].replace(/<\w*:/g,`<`)){case`<condense`:break;case`<extend`:break;case`<shadow`:if(!a.val)break;case`<shadow>`:case`<shadow/>`:t.shadow=1;break;case`</shadow>`:break;case`<charset`:if(a.val==`1`)break;t.cp=A[parseInt(a.val,10)];break;case`<outline`:if(!a.val)break;case`<outline>`:case`<outline/>`:t.outline=1;break;case`</outline>`:break;case`<rFont`:t.name=a.val;break;case`<sz`:t.sz=a.val;break;case`<strike`:if(!a.val)break;case`<strike>`:case`<strike/>`:t.strike=1;break;case`</strike>`:break;case`<u`:if(!a.val)break;switch(a.val){case`double`:t.uval=`double`;break;case`singleAccounting`:t.uval=`single-accounting`;break;case`doubleAccounting`:t.uval=`double-accounting`;break}case`<u>`:case`<u/>`:t.u=1;break;case`</u>`:break;case`<b`:if(a.val==`0`)break;case`<b>`:case`<b/>`:t.b=1;break;case`</b>`:break;case`<i`:if(a.val==`0`)break;case`<i>`:case`<i/>`:t.i=1;break;case`</i>`:break;case`<color`:a.rgb&&(t.color=a.rgb.slice(2,8));break;case`<color>`:case`<color/>`:case`</color>`:break;case`<family`:t.family=a.val;break;case`<family>`:case`<family/>`:case`</family>`:break;case`<vertAlign`:t.valign=a.val;break;case`<vertAlign>`:case`<vertAlign/>`:case`</vertAlign>`:break;case`<scheme`:break;case`<scheme>`:case`<scheme/>`:case`</scheme>`:break;case`<extLst`:case`<extLst>`:case`</extLst>`:break;case`<ext`:i=!0;break;case`</ext>`:i=!1;break;default:if(a[0].charCodeAt(1)!==47&&!i)throw Error(`Unrecognized rich format `+a[0])}}return t}var Ls=(function(){function e(e){var t=an(e,`t`);if(!t)return{t:`s`,v:``};var n={t:`s`,v:jn(t[1])},r=an(e,`rPr`);return r&&(n.s=Is(r[1])),n}var t=/<(?:\w+:)?r>/g,n=/<\/(?:\w+:)?r>/;return function(r){return r.replace(t,``).split(n).map(e).filter(function(e){return e.v})}})(),Rs=(function(){var e=/(\r\n|\n)/g;function t(e,t,n){var r=[];e.u&&r.push(`text-decoration: underline;`),e.uval&&r.push(`text-underline-style:`+e.uval+`;`),e.sz&&r.push(`font-size:`+e.sz+`pt;`),e.outline&&r.push(`text-effect: outline;`),e.shadow&&r.push(`text-shadow: auto;`),t.push(`<span style="`+r.join(``)+`">`),e.b&&(t.push(`<b>`),n.push(`</b>`)),e.i&&(t.push(`<i>`),n.push(`</i>`)),e.strike&&(t.push(`<s>`),n.push(`</s>`));var i=e.valign||``;return i==`superscript`||i==`super`?i=`sup`:i==`subscript`&&(i=`sub`),i!=``&&(t.push(`<`+i+`>`),n.push(`</`+i+`>`)),n.push(`</span>`),e}function n(n){var r=[[],n.v,[]];return n.v?(n.s&&t(n.s,r[0],r[2]),r[0].join(``)+r[1].replace(e,`<br/>`)+r[2].join(``)):``}return function(e){return e.map(n).join(``)}})(),zs=/<(?:\w+:)?t\b[^<>]*>([^<]*)<\/(?:\w+:)?t>/g,Bs=/<(?:\w+:)?r\b[^<>]*>/;function Vs(e,t){var n=!t||t.cellHTML,r={};return e?(e.match(/^\s*<(?:\w+:)?t[^>]*>/)?(r.t=jn(Vn(e.slice(e.indexOf(`>`)+1).split(/<\/(?:\w+:)?t>/)[0]||``),!0),r.r=Vn(e),n&&(r.h=Pn(r.t))):e.match(Bs)&&(r.r=Vn(e),r.t=jn(Vn((sn(e,`rPh`).match(zs)||[]).join(``).replace(wn,``)),!0),n&&(r.h=Rs(Ls(r.r)))),r):{t:``}}var Hs=/<(?:\w+:)?(?:si|sstItem)>/g,Us=/<\/(?:\w+:)?(?:si|sstItem)>/;function Ws(e,t){var n=[],r=``;if(!e)return n;var i=an(e,`sst`);if(i){r=i[1].replace(Hs,``).split(Us);for(var a=0;a!=r.length;++a){var o=Vs(r[a].trim(),t);o!=null&&(n[n.length]=o)}i=q(i[0].slice(0,i[0].indexOf(`>`))),n.Count=i.count,n.Unique=i.uniqueCount}return n}function Gs(e){return[e.read_shift(4),e.read_shift(4)]}function Ks(e,t){var n=[],r=!1;return zr(e,function(e,i,a){switch(a){case 159:n.Count=e[0],n.Unique=e[1];break;case 19:n.push(e);break;case 160:return!0;case 35:r=!0;break;case 36:r=!1;break;default:if(i.T,!r||t.WTF)throw Error(`Unexpected record 0x`+a.toString(16))}}),n}function qs(e){if(O!==void 0)return O.utils.encode(D,e);for(var t=[],n=e.split(``),r=0;r<n.length;++r)t[r]=n[r].charCodeAt(0);return t}function Js(e,t){var n={};return n.Major=e.read_shift(2),n.Minor=e.read_shift(2),t>=4&&(e.l+=t-4),n}function Ys(e){var t={};return t.id=e.read_shift(0,`lpp4`),t.R=Js(e,4),t.U=Js(e,4),t.W=Js(e,4),t}function Xs(e){for(var t=e.read_shift(4),n=e.l+t-4,r={},i=e.read_shift(4),a=[];i-->0;)a.push({t:e.read_shift(4),v:e.read_shift(0,`lpp4`)});if(r.name=e.read_shift(0,`lpp4`),r.comps=a,e.l!=n)throw Error(`Bad DataSpaceMapEntry: `+e.l+` != `+n);return r}function Zs(e){var t=[];e.l+=4;for(var n=e.read_shift(4);n-->0;)t.push(Xs(e));return t}function Qs(e){var t=[];e.l+=4;for(var n=e.read_shift(4);n-->0;)t.push(e.read_shift(0,`lpp4`));return t}function $s(e){var t={};return e.read_shift(4),e.l+=4,t.id=e.read_shift(0,`lpp4`),t.name=e.read_shift(0,`lpp4`),t.R=Js(e,4),t.U=Js(e,4),t.W=Js(e,4),t}function ec(e){var t=$s(e);if(t.ename=e.read_shift(0,`8lpp4`),t.blksz=e.read_shift(4),t.cmode=e.read_shift(4),e.read_shift(4)!=4)throw Error(`Bad !Primary record`);return t}function tc(e,t){var n=e.l+t,r={};r.Flags=e.read_shift(4)&63,e.l+=4,r.AlgID=e.read_shift(4);var i=!1;switch(r.AlgID){case 26126:case 26127:case 26128:i=r.Flags==36;break;case 26625:i=r.Flags==4;break;case 0:i=r.Flags==16||r.Flags==4||r.Flags==36;break;default:throw`Unrecognized encryption algorithm: `+r.AlgID}if(!i)throw Error(`Encryption Flags/AlgID mismatch`);return r.AlgIDHash=e.read_shift(4),r.KeySize=e.read_shift(4),r.ProviderType=e.read_shift(4),e.l+=8,r.CSPName=e.read_shift(n-e.l>>1,`utf16le`),e.l=n,r}function nc(e,t){var n={},r=e.l+t;return e.l+=4,n.Salt=e.slice(e.l,e.l+16),e.l+=16,n.Verifier=e.slice(e.l,e.l+16),e.l+=16,e.read_shift(4),n.VerifierHash=e.slice(e.l,r),e.l=r,n}function rc(e){var t=Js(e);switch(t.Minor){case 2:return[t.Minor,ic(e,t)];case 3:return[t.Minor,ac(e,t)];case 4:return[t.Minor,oc(e,t)]}throw Error(`ECMA-376 Encrypted file unrecognized Version: `+t.Minor)}function ic(e){if((e.read_shift(4)&63)!=36)throw Error(`EncryptionInfo mismatch`);return{t:`Std`,h:tc(e,e.read_shift(4)),v:nc(e,e.length-e.l)}}function ac(){throw Error(`File is password-protected: ECMA-376 Extensible`)}function oc(e){var t=[`saltSize`,`blockSize`,`keyBits`,`hashSize`,`cipherAlgorithm`,`cipherChaining`,`hashAlgorithm`,`saltValue`];e.l+=4;var n=e.read_shift(e.length-e.l,`utf8`),r={};return n.replace(wn,function(e){var n=q(e);switch(On(n[0])){case`<?xml`:break;case`<encryption`:case`</encryption>`:break;case`<keyData`:t.forEach(function(e){r[e]=n[e]});break;case`<dataIntegrity`:r.encryptedHmacKey=n.encryptedHmacKey,r.encryptedHmacValue=n.encryptedHmacValue;break;case`<keyEncryptors>`:case`<keyEncryptors`:r.encs=[];break;case`</keyEncryptors>`:break;case`<keyEncryptor`:r.uri=n.uri;break;case`</keyEncryptor>`:break;case`<encryptedKey`:r.encs.push(n);break;default:throw n[0]}}),r}function sc(e,t){var n={},r=n.EncryptionVersionInfo=Js(e,4);if(t-=4,r.Minor!=2)throw Error(`unrecognized minor version code: `+r.Minor);if(r.Major>4||r.Major<2)throw Error(`unrecognized major version code: `+r.Major);n.Flags=e.read_shift(4),t-=4;var i=e.read_shift(4);return t-=4,n.EncryptionHeader=tc(e,i),t-=i,n.EncryptionVerifier=nc(e,t),n}function cc(e){var t={},n=t.EncryptionVersionInfo=Js(e,4);if(n.Major!=1||n.Minor!=1)throw`unrecognized version code `+n.Major+` : `+n.Minor;return t.Salt=e.read_shift(16),t.EncryptedVerifier=e.read_shift(16),t.EncryptedVerifierHash=e.read_shift(16),t}function lc(e){var t=0,n,r=qs(e),i=r.length+1,a,o,s,c,l;for(n=oe(i),n[0]=r.length,a=1;a!=i;++a)n[a]=r[a-1];for(a=i-1;a>=0;--a)o=n[a],s=t&16384?1:0,c=t<<1&32767,l=s|c,t=l^o;return t^52811}var uc=(function(){var e=[187,255,255,186,255,255,185,128,0,190,15,0,191,15,0],t=[57840,7439,52380,33984,4364,3600,61902,12606,6258,57657,54287,34041,10252,43370,20163],n=[44796,19929,39858,10053,20106,40212,10761,31585,63170,64933,60267,50935,40399,11199,17763,35526,1453,2906,5812,11624,23248,885,1770,3540,7080,14160,28320,56640,55369,41139,20807,41614,21821,43642,17621,28485,56970,44341,19019,38038,14605,29210,60195,50791,40175,10751,21502,43004,24537,18387,36774,3949,7898,15796,31592,63184,47201,24803,49606,37805,14203,28406,56812,17824,35648,1697,3394,6788,13576,27152,43601,17539,35078,557,1114,2228,4456,30388,60776,51953,34243,7079,14158,28316,14128,28256,56512,43425,17251,34502,7597,13105,26210,52420,35241,883,1766,3532,4129,8258,16516,33032,4657,9314,18628],r=function(e){return(e/2|e*128)&255},i=function(e,t){return r(e^t)},a=function(e){for(var r=t[e.length-1],i=104,a=e.length-1;a>=0;--a)for(var o=e[a],s=0;s!=7;++s)o&64&&(r^=n[i]),o*=2,--i;return r};return function(t){for(var n=qs(t),r=a(n),o=n.length,s=oe(16),c=0;c!=16;++c)s[c]=0;var l,u,d;for((o&1)==1&&(l=r>>8,s[o]=i(e[0],l),--o,l=r&255,u=n[n.length-1],s[o]=i(u,l));o>0;)--o,l=r>>8,s[o]=i(n[o],l),--o,l=r&255,s[o]=i(n[o],l);for(o=15,d=15-n.length;d>0;)l=r>>8,s[o]=i(e[d],l),--o,--d,l=r&255,s[o]=i(n[o],l),--o,--d;return s}})(),dc=function(e,t,n,r,i){i||=t,r||=uc(e);var a,o;for(a=0;a!=t.length;++a)o=t[a],o^=r[n],o=(o>>5|o<<3)&255,i[a]=o,++n;return[i,n,r]},fc=function(e){var t=0,n=uc(e);return function(e){var r=dc(``,e,t,n);return t=r[1],r[0]}};function pc(e,t,n,r){var i={key:Ia(e),verificationBytes:Ia(e)};return n.password&&(i.verifier=lc(n.password)),r.valid=i.verificationBytes===i.verifier,r.valid&&(r.insitu=fc(n.password)),i}function mc(e,t,n){var r=n||{};return r.Info=e.read_shift(2),e.l-=2,r.Info===1?r.Data=cc(e,t):r.Data=sc(e,t),r}function hc(e,t,n){var r={Type:n.biff>=8?e.read_shift(2):0};return r.Type?mc(e,t-2,r):pc(e,n.biff>=8?t:t-2,n,r),r}function gc(e,t){switch(t.type){case`base64`:return _c(H(e),t);case`binary`:return _c(e,t);case`buffer`:return _c(U&&Buffer.isBuffer(e)?e.toString(`binary`):ce(e),t);case`array`:return _c(Rt(e),t)}throw Error(`Unrecognized type `+t.type)}function _c(e,t){var n=t||{},r={},i=n.dense;i&&(r[`!data`]=[]);var a=en(e,`\\trowd`,`\\row`);if(!a)throw Error(`RTF missing table`);var o={s:{c:0,r:0},e:{c:0,r:a.length-1}},s=[];return a.forEach(function(e,t){i&&(s=r[`!data`][t]=[]);for(var a=/\\[\w\-]+\b/g,c=0,l,u=-1,d=[];(l=a.exec(e))!=null;){var f=e.slice(c,a.lastIndex-l[0].length);switch(f.charCodeAt(0)==32&&(f=f.slice(1)),f.length&&d.push(f),l[0]){case`\\cell`:if(++u,d.length){var p={v:d.join(``),t:`s`};p.v==`TRUE`||p.v==`FALSE`?(p.v=p.v==`TRUE`,p.t=`b`):isNaN(Vt(p.v))?Zi[p.v]!=null&&(p.t=`e`,p.w=p.v,p.v=Zi[p.v]):(p.t=`n`,n.cellText!==!1&&(p.w=p.v),p.v=Vt(p.v)),i?s[u]=p:r[ti({r:t,c:u})]=p}d=[];break;case`\\par`:d.push(`
`);break}c=a.lastIndex}u>o.e.c&&(o.e.c=u)}),r[`!ref`]=ri(o),r}function vc(e,t){var n=ci(gc(e,t),t);return n.bookType=`rtf`,n}function yc(e){var t=e.slice(+(e[0]===`#`)).slice(0,6);return[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]}function bc(e){for(var t=0,n=1;t!=3;++t)n=n*256+(e[t]>255?255:e[t]<0?0:e[t]);return n.toString(16).toUpperCase().slice(1)}function xc(e){var t=e[0]/255,n=e[1]/255,r=e[2]/255,i=Math.max(t,n,r),a=Math.min(t,n,r),o=i-a;if(o===0)return[0,0,t];var s=0,c=0,l=i+a;switch(c=o/(l>1?2-l:l),i){case t:s=((n-r)/o+6)%6;break;case n:s=(r-t)/o+2;break;case r:s=(t-n)/o+4;break}return[s/6,c,l/2]}function Sc(e){var t=e[0],n=e[1],r=e[2],i=n*2*(r<.5?r:1-r),a=r-i/2,o=[a,a,a],s=6*t,c;if(n!==0)switch(s|0){case 0:case 6:c=i*s,o[0]+=i,o[1]+=c;break;case 1:c=i*(2-s),o[0]+=c,o[1]+=i;break;case 2:c=i*(s-2),o[1]+=i,o[2]+=c;break;case 3:c=i*(4-s),o[1]+=c,o[2]+=i;break;case 4:c=i*(s-4),o[2]+=i,o[0]+=c;break;case 5:c=i*(6-s),o[2]+=c,o[0]+=i;break}for(var l=0;l!=3;++l)o[l]=Math.round(o[l]*255);return o}function Cc(e,t){if(t===0)return e;var n=xc(yc(e));return t<0?n[2]*=1+t:n[2]=1-(1-n[2])*(1-t),bc(Sc(n))}var wc=6,Tc=15,Ec=1,Dc=wc;function Oc(e){return Math.floor((e+Math.round(128/Dc)/256)*Dc)}function kc(e){return Math.floor((e-5)/Dc*100+.5)/100}function Ac(e){return Math.round((e*Dc+5)/Dc*256)/256}function jc(e){return Ac(kc(Oc(e)))}function Mc(e){var t=Math.abs(e-jc(e)),n=Dc;if(t>.005)for(Dc=Ec;Dc<Tc;++Dc)Math.abs(e-jc(e))<=t&&(t=Math.abs(e-jc(e)),n=Dc);Dc=n}function Nc(e){e.width?(e.wpx=Oc(e.width),e.wch=kc(e.wpx),e.MDW=Dc):e.wpx?(e.wch=kc(e.wpx),e.width=Ac(e.wch),e.MDW=Dc):typeof e.wch==`number`&&(e.width=Ac(e.wch),e.wpx=Oc(e.width),e.MDW=Dc),e.customWidth&&delete e.customWidth}var Pc=96;function Fc(e){return e*96/Pc}function Ic(e){return e*Pc/96}var Lc={None:`none`,Solid:`solid`,Gray50:`mediumGray`,Gray75:`darkGray`,Gray25:`lightGray`,HorzStripe:`darkHorizontal`,VertStripe:`darkVertical`,ReverseDiagStripe:`darkDown`,DiagStripe:`darkUp`,DiagCross:`darkGrid`,ThickDiagCross:`darkTrellis`,ThinHorzStripe:`lightHorizontal`,ThinVertStripe:`lightVertical`,ThinReverseDiagStripe:`lightDown`,ThinHorzCross:`lightGrid`};function Rc(e,t,n,r){t.Borders=[];var i={},a=!1;(e.match(wn)||[]).forEach(function(e){var n=q(e);switch(On(n[0])){case`<borders`:case`<borders>`:case`</borders>`:break;case`<border`:case`<border>`:case`<border/>`:i={},n.diagonalUp&&(i.diagonalUp=In(n.diagonalUp)),n.diagonalDown&&(i.diagonalDown=In(n.diagonalDown)),t.Borders.push(i);break;case`</border>`:break;case`<left/>`:break;case`<left`:case`<left>`:break;case`</left>`:break;case`<right/>`:break;case`<right`:case`<right>`:break;case`</right>`:break;case`<top/>`:break;case`<top`:case`<top>`:break;case`</top>`:break;case`<bottom/>`:break;case`<bottom`:case`<bottom>`:break;case`</bottom>`:break;case`<diagonal`:case`<diagonal>`:case`<diagonal/>`:break;case`</diagonal>`:break;case`<horizontal`:case`<horizontal>`:case`<horizontal/>`:break;case`</horizontal>`:break;case`<vertical`:case`<vertical>`:case`<vertical/>`:break;case`</vertical>`:break;case`<start`:case`<start>`:case`<start/>`:break;case`</start>`:break;case`<end`:case`<end>`:case`<end/>`:break;case`</end>`:break;case`<color`:case`<color>`:break;case`<color/>`:case`</color>`:break;case`<extLst`:case`<extLst>`:case`</extLst>`:break;case`<ext`:a=!0;break;case`</ext>`:a=!1;break;default:if(r&&r.WTF&&!a)throw Error(`unrecognized `+n[0]+` in borders`)}})}function zc(e,t,n,r){t.Fills=[];var i={},a=!1;(e.match(wn)||[]).forEach(function(e){var n=q(e);switch(On(n[0])){case`<fills`:case`<fills>`:case`</fills>`:break;case`<fill>`:case`<fill`:case`<fill/>`:i={},t.Fills.push(i);break;case`</fill>`:break;case`<gradientFill>`:break;case`<gradientFill`:case`</gradientFill>`:t.Fills.push(i),i={};break;case`<patternFill`:case`<patternFill>`:n.patternType&&(i.patternType=n.patternType);break;case`<patternFill/>`:case`</patternFill>`:break;case`<bgColor`:i.bgColor||={},n.indexed&&(i.bgColor.indexed=parseInt(n.indexed,10)),n.theme&&(i.bgColor.theme=parseInt(n.theme,10)),n.tint&&(i.bgColor.tint=parseFloat(n.tint)),n.rgb&&(i.bgColor.rgb=n.rgb.slice(-6));break;case`<bgColor/>`:case`</bgColor>`:break;case`<fgColor`:i.fgColor||={},n.theme&&(i.fgColor.theme=parseInt(n.theme,10)),n.tint&&(i.fgColor.tint=parseFloat(n.tint)),n.rgb!=null&&(i.fgColor.rgb=n.rgb.slice(-6));break;case`<fgColor/>`:case`</fgColor>`:break;case`<stop`:case`<stop/>`:break;case`</stop>`:break;case`<color`:case`<color/>`:break;case`</color>`:break;case`<extLst`:case`<extLst>`:case`</extLst>`:break;case`<ext`:a=!0;break;case`</ext>`:a=!1;break;default:if(r&&r.WTF&&!a)throw Error(`unrecognized `+n[0]+` in fills`)}})}function Bc(e,t,n,r){t.Fonts=[];var i={},a=!1;(e.match(wn)||[]).forEach(function(e){var o=q(e);switch(On(o[0])){case`<fonts`:case`<fonts>`:case`</fonts>`:break;case`<font`:case`<font>`:break;case`</font>`:case`<font/>`:t.Fonts.push(i),i={};break;case`<name`:o.val&&(i.name=Vn(o.val));break;case`<name/>`:case`</name>`:break;case`<b`:i.bold=o.val?In(o.val):1;break;case`<b/>`:i.bold=1;break;case`</b>`:case`</b`:break;case`<i`:i.italic=o.val?In(o.val):1;break;case`<i/>`:i.italic=1;break;case`</i>`:case`</i`:break;case`<u`:switch(o.val){case`none`:i.underline=0;break;case`single`:i.underline=1;break;case`double`:i.underline=2;break;case`singleAccounting`:i.underline=33;break;case`doubleAccounting`:i.underline=34;break}break;case`<u/>`:i.underline=1;break;case`</u>`:case`</u`:break;case`<strike`:i.strike=o.val?In(o.val):1;break;case`<strike/>`:i.strike=1;break;case`</strike>`:case`</strike`:break;case`<outline`:i.outline=o.val?In(o.val):1;break;case`<outline/>`:i.outline=1;break;case`</outline>`:case`</outline`:break;case`<shadow`:i.shadow=o.val?In(o.val):1;break;case`<shadow/>`:i.shadow=1;break;case`</shadow>`:case`</shadow`:break;case`<condense`:i.condense=o.val?In(o.val):1;break;case`<condense/>`:i.condense=1;break;case`</condense>`:case`</condense`:break;case`<extend`:i.extend=o.val?In(o.val):1;break;case`<extend/>`:i.extend=1;break;case`</extend>`:case`</extend`:break;case`<sz`:o.val&&(i.sz=+o.val);break;case`<sz/>`:case`</sz>`:case`</sz`:break;case`<vertAlign`:o.val&&(i.vertAlign=o.val);break;case`<vertAlign/>`:case`</vertAlign>`:case`</vertAlign`:break;case`<family`:o.val&&(i.family=parseInt(o.val,10));break;case`<family/>`:case`</family>`:case`</family`:break;case`<scheme`:o.val&&(i.scheme=o.val);break;case`<scheme/>`:case`</scheme>`:case`</scheme`:break;case`<charset`:if(o.val==`1`)break;o.codepage=A[parseInt(o.val,10)];break;case`<charset/>`:case`</charset>`:case`</charset`:break;case`<color`:if(i.color||={},o.auto&&(i.color.auto=In(o.auto)),o.rgb)i.color.rgb=o.rgb.slice(-6);else if(o.indexed){i.color.index=parseInt(o.indexed,10);var s=Yi[i.color.index];i.color.index==81&&(s=Yi[1]),s||=Yi[1],i.color.rgb=s[0].toString(16)+s[1].toString(16)+s[2].toString(16)}else o.theme&&(i.color.theme=parseInt(o.theme,10),o.tint&&(i.color.tint=parseFloat(o.tint)),o.theme&&n.themeElements&&n.themeElements.clrScheme&&(i.color.rgb=Cc(n.themeElements.clrScheme[i.color.theme].rgb,i.color.tint||0)));break;case`<color/>`:case`</color>`:case`</color`:break;case`<AlternateContent`:a=!0;break;case`</AlternateContent>`:case`</AlternateContent`:a=!1;break;case`<extLst`:case`<extLst>`:case`</extLst>`:break;case`<ext`:a=!0;break;case`</ext>`:a=!1;break;default:if(r&&r.WTF&&!a)throw Error(`unrecognized `+o[0]+` in fonts`)}})}function Vc(e,t,n){t.NumberFmt=[];for(var r=Et(G),i=0;i<r.length;++i)t.NumberFmt[r[i]]=G[r[i]];var a=e.match(wn);if(a)for(i=0;i<a.length;++i){var o=q(a[i]);switch(On(o[0])){case`<numFmts`:case`</numFmts>`:case`<numFmts/>`:case`<numFmts>`:break;case`<numFmt`:var s=jn(Vn(o.formatCode)),c=parseInt(o.numFmtId,10);if(t.NumberFmt[c]=s,c>0){if(c>392){for(c=392;c>60&&t.NumberFmt[c]!=null;--c);t.NumberFmt[c]=s}St(s,c)}break;case`</numFmt>`:break;default:if(n.WTF)throw Error(`unrecognized `+o[0]+` in numFmts`)}}}var Hc=[`numFmtId`,`fillId`,`fontId`,`borderId`,`xfId`],Uc=[`applyAlignment`,`applyBorder`,`applyFill`,`applyFont`,`applyNumberFormat`,`applyProtection`,`pivotButton`,`quotePrefix`];function Wc(e,t,n){t.CellXf=[];var r,i=!1;(e.match(wn)||[]).forEach(function(e){var a=q(e),o=0;switch(On(a[0])){case`<cellXfs`:case`<cellXfs>`:case`<cellXfs/>`:case`</cellXfs>`:break;case`<xf`:case`<xf/>`:case`<xf>`:for(r=a,delete r[0],o=0;o<Hc.length;++o)r[Hc[o]]&&(r[Hc[o]]=parseInt(r[Hc[o]],10));for(o=0;o<Uc.length;++o)r[Uc[o]]&&(r[Uc[o]]=In(r[Uc[o]]));if(t.NumberFmt&&r.numFmtId>392){for(o=392;o>60;--o)if(t.NumberFmt[r.numFmtId]==t.NumberFmt[o]){r.numFmtId=o;break}}t.CellXf.push(r);break;case`</xf>`:break;case`<alignment`:case`<alignment/>`:case`<alignment>`:var s={};a.vertical&&(s.vertical=a.vertical),a.horizontal&&(s.horizontal=a.horizontal),a.textRotation!=null&&(s.textRotation=a.textRotation),a.indent&&(s.indent=a.indent),a.wrapText&&(s.wrapText=In(a.wrapText)),r.alignment=s;break;case`</alignment>`:break;case`<protection`:case`<protection>`:break;case`</protection>`:case`<protection/>`:break;case`<AlternateContent`:case`<AlternateContent>`:i=!0;break;case`</AlternateContent>`:i=!1;break;case`<extLst`:case`<extLst>`:case`</extLst>`:break;case`<ext`:i=!0;break;case`</ext>`:i=!1;break;default:if(n&&n.WTF&&!i)throw Error(`unrecognized `+a[0]+` in cellXfs`)}})}var Gc=(function(){return function(e,t,n){var r={};if(!e)return r;e=$t(tn(e,`<!--`,`-->`));var i;return(i=an(e,`numFmts`))&&Vc(i[0],r,n),(i=an(e,`fonts`))&&Bc(i[0],r,t,n),(i=an(e,`fills`))&&zc(i[0],r,t,n),(i=an(e,`borders`))&&Rc(i[0],r,t,n),(i=an(e,`cellXfs`))&&Wc(i[0],r,n),r}})();function Kc(e,t){return[e.read_shift(2),pi(e,t-2)]}function qc(e,t,n){var r={};r.sz=e.read_shift(2)/20;var i=Di(e,2,n);switch(i.fItalic&&(r.italic=1),i.fCondense&&(r.condense=1),i.fExtend&&(r.extend=1),i.fShadow&&(r.shadow=1),i.fOutline&&(r.outline=1),i.fStrikeout&&(r.strike=1),e.read_shift(2)===700&&(r.bold=1),e.read_shift(2)){case 1:r.vertAlign=`superscript`;break;case 2:r.vertAlign=`subscript`;break}var a=e.read_shift(1);a!=0&&(r.underline=a);var o=e.read_shift(1);o>0&&(r.family=o);var s=e.read_shift(1);switch(s>0&&(r.charset=s),e.l++,r.color=Ei(e,8),e.read_shift(1)){case 1:r.scheme=`major`;break;case 2:r.scheme=`minor`;break}return r.name=pi(e,t-21),r}var Jc=Lr;function Yc(e,t){var n=e.l+t,r=e.read_shift(2),i=e.read_shift(2);return e.l=n,{ixfe:r,numFmtId:i}}var Xc=Lr;function Zc(e,t,n){var r={};for(var i in r.NumberFmt=[],G)r.NumberFmt[i]=G[i];r.CellXf=[],r.Fonts=[];var a=[],o=!1;return zr(e,function(e,i,s){switch(s){case 44:r.NumberFmt[e[0]]=e[1],St(e[1],e[0]);break;case 43:r.Fonts.push(e),e.color.theme!=null&&t&&t.themeElements&&t.themeElements.clrScheme&&(e.color.rgb=Cc(t.themeElements.clrScheme[e.color.theme].rgb,e.color.tint||0));break;case 1025:break;case 45:break;case 46:break;case 47:a[a.length-1]==617&&r.CellXf.push(e);break;case 48:case 507:case 572:case 475:break;case 1171:case 2102:case 1130:case 512:case 2095:case 3072:break;case 35:o=!0;break;case 36:o=!1;break;case 37:a.push(s),o=!0;break;case 38:a.pop(),o=!1;break;default:if(i.T>0)a.push(s);else if(i.T<0)a.pop();else if(!o||n.WTF&&a[a.length-1]!=37)throw Error(`Unexpected record 0x`+s.toString(16))}}),r}var Qc=[`</a:lt1>`,`</a:dk1>`,`</a:lt2>`,`</a:dk2>`,`</a:accent1>`,`</a:accent2>`,`</a:accent3>`,`</a:accent4>`,`</a:accent5>`,`</a:accent6>`,`</a:hlink>`,`</a:folHlink>`];function $c(e,t,n){t.themeElements.clrScheme=[];var r={};(e[0].match(wn)||[]).forEach(function(e){var i=q(e);switch(i[0]){case`<a:clrScheme`:case`</a:clrScheme>`:break;case`<a:srgbClr`:r.rgb=i.val;break;case`</a:srgbClr>`:break;case`<a:sysClr`:r.rgb=i.lastClr;break;case`</a:sysClr>`:break;case`</a:dk1>`:case`</a:lt1>`:case`<a:dk1>`:case`<a:lt1>`:case`<a:dk2>`:case`</a:dk2>`:case`<a:lt2>`:case`</a:lt2>`:case`<a:accent1>`:case`</a:accent1>`:case`<a:accent2>`:case`</a:accent2>`:case`<a:accent3>`:case`</a:accent3>`:case`<a:accent4>`:case`</a:accent4>`:case`<a:accent5>`:case`</a:accent5>`:case`<a:accent6>`:case`</a:accent6>`:case`<a:hlink>`:case`</a:hlink>`:case`<a:folHlink>`:case`</a:folHlink>`:i[0].charAt(1)===`/`?(t.themeElements.clrScheme[Qc.indexOf(i[0])]=r,r={}):r.name=i[0].slice(3,i[0].length-1);break;default:if(n&&n.WTF)throw Error(`Unrecognized `+i[0]+` in clrScheme`)}})}function el(e,t,n){t.themeElements={};var r;if(!(r=rn(e,`a:clrScheme`)))throw Error(`clrScheme not found in themeElements`);if($c(r,t,n),!(r=rn(e,`a:fontScheme`)))throw Error(`fontScheme not found in themeElements`);if(!(r=rn(e,`a:fmtScheme`)))throw Error(`fmtScheme not found in themeElements`)}function tl(e,t){(!e||e.length===0)&&(e=nl());var n,r={};if(!(n=rn(e,`a:themeElements`)))throw Error(`themeElements not found in theme`);return el(n[0],r,t),r.raw=e,r}function nl(e,t){if(t&&t.themeXLSX)return t.themeXLSX;if(e&&typeof e.raw==`string`)return e.raw;var n=[xn];return n[n.length]=`<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">`,n[n.length]=`<a:themeElements>`,n[n.length]=`<a:clrScheme name="Office">`,n[n.length]=`<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>`,n[n.length]=`<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>`,n[n.length]=`<a:dk2><a:srgbClr val="1F497D"/></a:dk2>`,n[n.length]=`<a:lt2><a:srgbClr val="EEECE1"/></a:lt2>`,n[n.length]=`<a:accent1><a:srgbClr val="4F81BD"/></a:accent1>`,n[n.length]=`<a:accent2><a:srgbClr val="C0504D"/></a:accent2>`,n[n.length]=`<a:accent3><a:srgbClr val="9BBB59"/></a:accent3>`,n[n.length]=`<a:accent4><a:srgbClr val="8064A2"/></a:accent4>`,n[n.length]=`<a:accent5><a:srgbClr val="4BACC6"/></a:accent5>`,n[n.length]=`<a:accent6><a:srgbClr val="F79646"/></a:accent6>`,n[n.length]=`<a:hlink><a:srgbClr val="0000FF"/></a:hlink>`,n[n.length]=`<a:folHlink><a:srgbClr val="800080"/></a:folHlink>`,n[n.length]=`</a:clrScheme>`,n[n.length]=`<a:fontScheme name="Office">`,n[n.length]=`<a:majorFont>`,n[n.length]=`<a:latin typeface="Cambria"/>`,n[n.length]=`<a:ea typeface=""/>`,n[n.length]=`<a:cs typeface=""/>`,n[n.length]=`<a:font script="Jpan" typeface="ＭＳ Ｐゴシック"/>`,n[n.length]=`<a:font script="Hang" typeface="맑은 고딕"/>`,n[n.length]=`<a:font script="Hans" typeface="宋体"/>`,n[n.length]=`<a:font script="Hant" typeface="新細明體"/>`,n[n.length]=`<a:font script="Arab" typeface="Times New Roman"/>`,n[n.length]=`<a:font script="Hebr" typeface="Times New Roman"/>`,n[n.length]=`<a:font script="Thai" typeface="Tahoma"/>`,n[n.length]=`<a:font script="Ethi" typeface="Nyala"/>`,n[n.length]=`<a:font script="Beng" typeface="Vrinda"/>`,n[n.length]=`<a:font script="Gujr" typeface="Shruti"/>`,n[n.length]=`<a:font script="Khmr" typeface="MoolBoran"/>`,n[n.length]=`<a:font script="Knda" typeface="Tunga"/>`,n[n.length]=`<a:font script="Guru" typeface="Raavi"/>`,n[n.length]=`<a:font script="Cans" typeface="Euphemia"/>`,n[n.length]=`<a:font script="Cher" typeface="Plantagenet Cherokee"/>`,n[n.length]=`<a:font script="Yiii" typeface="Microsoft Yi Baiti"/>`,n[n.length]=`<a:font script="Tibt" typeface="Microsoft Himalaya"/>`,n[n.length]=`<a:font script="Thaa" typeface="MV Boli"/>`,n[n.length]=`<a:font script="Deva" typeface="Mangal"/>`,n[n.length]=`<a:font script="Telu" typeface="Gautami"/>`,n[n.length]=`<a:font script="Taml" typeface="Latha"/>`,n[n.length]=`<a:font script="Syrc" typeface="Estrangelo Edessa"/>`,n[n.length]=`<a:font script="Orya" typeface="Kalinga"/>`,n[n.length]=`<a:font script="Mlym" typeface="Kartika"/>`,n[n.length]=`<a:font script="Laoo" typeface="DokChampa"/>`,n[n.length]=`<a:font script="Sinh" typeface="Iskoola Pota"/>`,n[n.length]=`<a:font script="Mong" typeface="Mongolian Baiti"/>`,n[n.length]=`<a:font script="Viet" typeface="Times New Roman"/>`,n[n.length]=`<a:font script="Uigh" typeface="Microsoft Uighur"/>`,n[n.length]=`<a:font script="Geor" typeface="Sylfaen"/>`,n[n.length]=`</a:majorFont>`,n[n.length]=`<a:minorFont>`,n[n.length]=`<a:latin typeface="Calibri"/>`,n[n.length]=`<a:ea typeface=""/>`,n[n.length]=`<a:cs typeface=""/>`,n[n.length]=`<a:font script="Jpan" typeface="ＭＳ Ｐゴシック"/>`,n[n.length]=`<a:font script="Hang" typeface="맑은 고딕"/>`,n[n.length]=`<a:font script="Hans" typeface="宋体"/>`,n[n.length]=`<a:font script="Hant" typeface="新細明體"/>`,n[n.length]=`<a:font script="Arab" typeface="Arial"/>`,n[n.length]=`<a:font script="Hebr" typeface="Arial"/>`,n[n.length]=`<a:font script="Thai" typeface="Tahoma"/>`,n[n.length]=`<a:font script="Ethi" typeface="Nyala"/>`,n[n.length]=`<a:font script="Beng" typeface="Vrinda"/>`,n[n.length]=`<a:font script="Gujr" typeface="Shruti"/>`,n[n.length]=`<a:font script="Khmr" typeface="DaunPenh"/>`,n[n.length]=`<a:font script="Knda" typeface="Tunga"/>`,n[n.length]=`<a:font script="Guru" typeface="Raavi"/>`,n[n.length]=`<a:font script="Cans" typeface="Euphemia"/>`,n[n.length]=`<a:font script="Cher" typeface="Plantagenet Cherokee"/>`,n[n.length]=`<a:font script="Yiii" typeface="Microsoft Yi Baiti"/>`,n[n.length]=`<a:font script="Tibt" typeface="Microsoft Himalaya"/>`,n[n.length]=`<a:font script="Thaa" typeface="MV Boli"/>`,n[n.length]=`<a:font script="Deva" typeface="Mangal"/>`,n[n.length]=`<a:font script="Telu" typeface="Gautami"/>`,n[n.length]=`<a:font script="Taml" typeface="Latha"/>`,n[n.length]=`<a:font script="Syrc" typeface="Estrangelo Edessa"/>`,n[n.length]=`<a:font script="Orya" typeface="Kalinga"/>`,n[n.length]=`<a:font script="Mlym" typeface="Kartika"/>`,n[n.length]=`<a:font script="Laoo" typeface="DokChampa"/>`,n[n.length]=`<a:font script="Sinh" typeface="Iskoola Pota"/>`,n[n.length]=`<a:font script="Mong" typeface="Mongolian Baiti"/>`,n[n.length]=`<a:font script="Viet" typeface="Arial"/>`,n[n.length]=`<a:font script="Uigh" typeface="Microsoft Uighur"/>`,n[n.length]=`<a:font script="Geor" typeface="Sylfaen"/>`,n[n.length]=`</a:minorFont>`,n[n.length]=`</a:fontScheme>`,n[n.length]=`<a:fmtScheme name="Office">`,n[n.length]=`<a:fillStyleLst>`,n[n.length]=`<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>`,n[n.length]=`<a:gradFill rotWithShape="1">`,n[n.length]=`<a:gsLst>`,n[n.length]=`<a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="50000"/><a:satMod val="300000"/></a:schemeClr></a:gs>`,n[n.length]=`<a:gs pos="35000"><a:schemeClr val="phClr"><a:tint val="37000"/><a:satMod val="300000"/></a:schemeClr></a:gs>`,n[n.length]=`<a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="15000"/><a:satMod val="350000"/></a:schemeClr></a:gs>`,n[n.length]=`</a:gsLst>`,n[n.length]=`<a:lin ang="16200000" scaled="1"/>`,n[n.length]=`</a:gradFill>`,n[n.length]=`<a:gradFill rotWithShape="1">`,n[n.length]=`<a:gsLst>`,n[n.length]=`<a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="100000"/><a:shade val="100000"/><a:satMod val="130000"/></a:schemeClr></a:gs>`,n[n.length]=`<a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="50000"/><a:shade val="100000"/><a:satMod val="350000"/></a:schemeClr></a:gs>`,n[n.length]=`</a:gsLst>`,n[n.length]=`<a:lin ang="16200000" scaled="0"/>`,n[n.length]=`</a:gradFill>`,n[n.length]=`</a:fillStyleLst>`,n[n.length]=`<a:lnStyleLst>`,n[n.length]=`<a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"><a:shade val="95000"/><a:satMod val="105000"/></a:schemeClr></a:solidFill><a:prstDash val="solid"/></a:ln>`,n[n.length]=`<a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>`,n[n.length]=`<a:ln w="38100" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>`,n[n.length]=`</a:lnStyleLst>`,n[n.length]=`<a:effectStyleLst>`,n[n.length]=`<a:effectStyle>`,n[n.length]=`<a:effectLst>`,n[n.length]=`<a:outerShdw blurRad="40000" dist="20000" dir="5400000" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="38000"/></a:srgbClr></a:outerShdw>`,n[n.length]=`</a:effectLst>`,n[n.length]=`</a:effectStyle>`,n[n.length]=`<a:effectStyle>`,n[n.length]=`<a:effectLst>`,n[n.length]=`<a:outerShdw blurRad="40000" dist="23000" dir="5400000" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="35000"/></a:srgbClr></a:outerShdw>`,n[n.length]=`</a:effectLst>`,n[n.length]=`</a:effectStyle>`,n[n.length]=`<a:effectStyle>`,n[n.length]=`<a:effectLst>`,n[n.length]=`<a:outerShdw blurRad="40000" dist="23000" dir="5400000" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="35000"/></a:srgbClr></a:outerShdw>`,n[n.length]=`</a:effectLst>`,n[n.length]=`<a:scene3d><a:camera prst="orthographicFront"><a:rot lat="0" lon="0" rev="0"/></a:camera><a:lightRig rig="threePt" dir="t"><a:rot lat="0" lon="0" rev="1200000"/></a:lightRig></a:scene3d>`,n[n.length]=`<a:sp3d><a:bevelT w="63500" h="25400"/></a:sp3d>`,n[n.length]=`</a:effectStyle>`,n[n.length]=`</a:effectStyleLst>`,n[n.length]=`<a:bgFillStyleLst>`,n[n.length]=`<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>`,n[n.length]=`<a:gradFill rotWithShape="1">`,n[n.length]=`<a:gsLst>`,n[n.length]=`<a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="40000"/><a:satMod val="350000"/></a:schemeClr></a:gs>`,n[n.length]=`<a:gs pos="40000"><a:schemeClr val="phClr"><a:tint val="45000"/><a:shade val="99000"/><a:satMod val="350000"/></a:schemeClr></a:gs>`,n[n.length]=`<a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="20000"/><a:satMod val="255000"/></a:schemeClr></a:gs>`,n[n.length]=`</a:gsLst>`,n[n.length]=`<a:path path="circle"><a:fillToRect l="50000" t="-80000" r="50000" b="180000"/></a:path>`,n[n.length]=`</a:gradFill>`,n[n.length]=`<a:gradFill rotWithShape="1">`,n[n.length]=`<a:gsLst>`,n[n.length]=`<a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="80000"/><a:satMod val="300000"/></a:schemeClr></a:gs>`,n[n.length]=`<a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="30000"/><a:satMod val="200000"/></a:schemeClr></a:gs>`,n[n.length]=`</a:gsLst>`,n[n.length]=`<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path>`,n[n.length]=`</a:gradFill>`,n[n.length]=`</a:bgFillStyleLst>`,n[n.length]=`</a:fmtScheme>`,n[n.length]=`</a:themeElements>`,n[n.length]=`<a:objectDefaults>`,n[n.length]=`<a:spDef>`,n[n.length]=`<a:spPr/><a:bodyPr/><a:lstStyle/><a:style><a:lnRef idx="1"><a:schemeClr val="accent1"/></a:lnRef><a:fillRef idx="3"><a:schemeClr val="accent1"/></a:fillRef><a:effectRef idx="2"><a:schemeClr val="accent1"/></a:effectRef><a:fontRef idx="minor"><a:schemeClr val="lt1"/></a:fontRef></a:style>`,n[n.length]=`</a:spDef>`,n[n.length]=`<a:lnDef>`,n[n.length]=`<a:spPr/><a:bodyPr/><a:lstStyle/><a:style><a:lnRef idx="2"><a:schemeClr val="accent1"/></a:lnRef><a:fillRef idx="0"><a:schemeClr val="accent1"/></a:fillRef><a:effectRef idx="1"><a:schemeClr val="accent1"/></a:effectRef><a:fontRef idx="minor"><a:schemeClr val="tx1"/></a:fontRef></a:style>`,n[n.length]=`</a:lnDef>`,n[n.length]=`</a:objectDefaults>`,n[n.length]=`<a:extraClrSchemeLst/>`,n[n.length]=`</a:theme>`,n.join(``)}function rl(e,t,n){var r=e.l+t;if(e.read_shift(4)!==124226){if(!n.cellStyles){e.l=r;return}var i=e.slice(e.l);e.l=r;var a;try{a=yn(i,{type:`array`})}catch{return}var o=hn(a,`theme/theme/theme1.xml`,!0);if(o)return tl(o,n)}}function il(e){return e.read_shift(4)}function al(e){var t={};switch(t.xclrType=e.read_shift(2),t.nTintShade=e.read_shift(2),t.xclrType){case 0:e.l+=4;break;case 1:t.xclrValue=ol(e,4);break;case 2:t.xclrValue=Xa(e,4);break;case 3:t.xclrValue=il(e,4);break;case 4:e.l+=4;break}return e.l+=8,t}function ol(e,t){return Lr(e,t)}function sl(e,t){return Lr(e,t)}function cl(e){var t=e.read_shift(2),n=e.read_shift(2)-4,r=[t];switch(t){case 4:case 5:case 7:case 8:case 9:case 10:case 11:case 13:r[1]=al(e,n);break;case 6:r[1]=sl(e,n);break;case 14:case 15:r[1]=e.read_shift(n===1?1:2);break;default:throw Error(`Unrecognized ExtProp type: `+t+` `+n)}return r}function ll(e,t){var n=e.l+t;e.l+=2;var r=e.read_shift(2);e.l+=2;for(var i=e.read_shift(2),a=[];i-->0;)a.push(cl(e,n-e.l));return{ixfe:r,ext:a}}function ul(e,t){t.forEach(function(e){switch(e[0]){case 4:break;case 5:break;case 6:break;case 7:break;case 8:break;case 9:break;case 10:break;case 11:break;case 13:break;case 14:break;case 15:break}})}function dl(e,t){return{flags:e.read_shift(4),version:e.read_shift(4),name:pi(e,t-8)}}function fl(e){for(var t=[],n=e.read_shift(4);n-->0;)t.push([e.read_shift(4),e.read_shift(4)]);return t}function pl(e){return e.l+=4,e.read_shift(4)!=0}function ml(e,t,n){var r={Types:[],Cell:[],Value:[]},i=n||{},a=[],o=!1,s=2;return zr(e,function(e,t,n){switch(n){case 335:r.Types.push({name:e.name});break;case 51:e.forEach(function(e){s==1?r.Cell.push({type:r.Types[e[0]-1].name,index:e[1]}):s==0&&r.Value.push({type:r.Types[e[0]-1].name,index:e[1]})});break;case 337:s=+!!e;break;case 338:s=2;break;case 35:a.push(n),o=!0;break;case 36:a.pop(),o=!1;break;default:if(!t.T&&(!o||i.WTF&&a[a.length-1]!=35))throw Error(`Unexpected record 0x`+n.toString(16))}}),r}function hl(e,t,n){var r={Types:[],Cell:[],Value:[]};if(!e)return r;var i=!1,a=2,o;return e.replace(wn,function(e){var t=q(e);switch(On(t[0])){case`<?xml`:break;case`<metadata`:case`</metadata>`:break;case`<metadataTypes`:case`</metadataTypes>`:break;case`<metadataType`:r.Types.push({name:t.name});break;case`</metadataType>`:break;case`<futureMetadata`:for(var s=0;s<r.Types.length;++s)r.Types[s].name==t.name&&(o=r.Types[s]);break;case`</futureMetadata>`:break;case`<bk>`:break;case`</bk>`:break;case`<rc`:a==1?r.Cell.push({type:r.Types[t.t-1].name,index:+t.v}):a==0&&r.Value.push({type:r.Types[t.t-1].name,index:+t.v});break;case`</rc>`:break;case`<cellMetadata`:a=1;break;case`</cellMetadata>`:a=2;break;case`<valueMetadata`:a=0;break;case`</valueMetadata>`:a=2;break;case`<extLst`:case`<extLst>`:case`</extLst>`:case`<extLst/>`:break;case`<ext`:i=!0;break;case`</ext>`:i=!1;break;case`<rvb`:if(!o)break;o.offsets||=[],o.offsets.push(+t.i);break;default:if(!i&&n?.WTF)throw Error(`unrecognized `+t[0]+` in metadata`)}return e}),r}function gl(e){var t=[];if(!e)return t;var n=1;return(e.match(wn)||[]).forEach(function(e){var r=q(e);switch(r[0]){case`<?xml`:break;case`<calcChain`:case`<calcChain>`:case`</calcChain>`:break;case`<c`:delete r[0],r.i?n=r.i:r.i=n,t.push(r);break}}),t}function _l(e){var t={};t.i=e.read_shift(4);var n={};n.r=e.read_shift(4),n.c=e.read_shift(4),t.r=ti(n);var r=e.read_shift(1);return r&2&&(t.l=`1`),r&8&&(t.a=`1`),t}function vl(e,t,n){var r=[];return zr(e,function(e,t,n){switch(n){case 63:r.push(e);break;default:if(!t.T)throw Error(`Unexpected record 0x`+n.toString(16))}}),r}function yl(e,t,n,r){if(!e)return e;var i=r||{},a=!1;zr(e,function(e,t,n){switch(n){case 359:case 363:case 364:case 366:case 367:case 368:case 369:case 370:case 371:case 472:case 577:case 578:case 579:case 580:case 581:case 582:case 583:case 584:case 585:case 586:case 587:break;case 35:a=!0;break;case 36:a=!1;break;default:if(!t.T&&(!a||i.WTF))throw Error(`Unexpected record 0x`+n.toString(16))}},i)}function bl(e,t){if(!e)return`??`;var n=(e.match(/<c:chart [^<>]*r:id="([^<>"]*)"/)||[``,``])[1];return t[`!id`][n].Target}function xl(e,t,n){var r=0;(on(e,`shape`)||[]).forEach(function(e){var i=``,a=!0,o=-1,s=-1,c=-1;switch(e.replace(wn,function(t,n){var r=q(t);switch(On(r[0])){case`<ClientData`:r.ObjectType&&(i=r.ObjectType);break;case`<Visible`:case`<Visible/>`:a=!1;break;case`<Row`:case`<Row>`:o=n+t.length;break;case`</Row>`:s=+e.slice(o,n).trim();break;case`<Column`:case`<Column>`:o=n+t.length;break;case`</Column>`:c=+e.slice(o,n).trim();break}return``}),i){case`Note`:var l=ah(t,s>=0&&c>=0?ti({r:s,c}):n[r].ref);l.c&&(l.c.hidden=a),++r;break}})}function Sl(e,t,n,r){var i=e[`!data`]!=null,a;t.forEach(function(t){var o=ei(t.ref);if(!(o.r<0||o.c<0)){if(i?(e[`!data`][o.r]||(e[`!data`][o.r]=[]),a=e[`!data`][o.r][o.c]):a=e[t.ref],!a){a={t:`z`},i?e[`!data`][o.r][o.c]=a:e[t.ref]=a;var s=ai(e[`!ref`]||`BDWGO1000001:A1`);s.s.r>o.r&&(s.s.r=o.r),s.e.r<o.r&&(s.e.r=o.r),s.s.c>o.c&&(s.s.c=o.c),s.e.c<o.c&&(s.e.c=o.c),e[`!ref`]=ri(s)}a.c||=[];var c={a:t.author,t:t.t,r:t.r,T:n};t.h&&(c.h=t.h);for(var l=a.c.length-1;l>=0;--l){if(!n&&a.c[l].T)return;n&&!a.c[l].T&&a.c.splice(l,1)}if(n&&r){for(l=0;l<r.length;++l)if(c.a==r[l].id){c.a=r[l].name||c.a;break}}a.c.push(c)}})}function Cl(e,t){if(e.match(/<(?:\w+:)?comments *\/>/))return[];var n=[],r=[],i=an(e,`authors`);i&&i[1]&&i[1].split(/<\/\w*:?author>/).forEach(function(e){if(!(e===``||e.trim()===``)){var t=e.match(/<(?:\w+:)?author[^<>]*>(.*)/);t&&n.push(t[1])}});var a=an(e,`commentList`);return a&&a[1]&&a[1].split(/<\/\w*:?comment>/).forEach(function(e){if(!(e===``||e.trim()===``)){var i=e.match(/<(?:\w+:)?comment[^<>]*>/);if(i){var a=q(i[0]),o={author:a.authorId&&n[a.authorId]||`sheetjsghost`,ref:a.ref,guid:a.guid},s=ei(a.ref);if(!(t.sheetRows&&t.sheetRows<=s.r)){var c=an(e,`text`),l=!!c&&!!c[1]&&Vs(c[1])||{r:``,t:``,h:``};o.r=l.r,l.r==`<t></t>`&&(l.t=l.h=``),o.t=(l.t||``).replace(/\r\n/g,`
`).replace(/\r/g,`
`),t.cellHTML&&(o.h=l.h),r.push(o)}}}}),r}function wl(e,t){var n=[],r=!1,i={},a=0;return e.replace(wn,function(o,s){var c=q(o);switch(On(c[0])){case`<?xml`:break;case`<ThreadedComments`:break;case`</ThreadedComments>`:break;case`<threadedComment`:i={author:c.personId,guid:c.id,ref:c.ref,T:1};break;case`</threadedComment>`:i.t!=null&&n.push(i);break;case`<text>`:case`<text`:a=s+o.length;break;case`</text>`:i.t=e.slice(a,s).replace(/\r\n/g,`
`).replace(/\r/g,`
`);break;case`<mentions`:case`<mentions>`:r=!0;break;case`</mentions>`:r=!1;break;case`<extLst`:case`<extLst>`:case`</extLst>`:case`<extLst/>`:break;case`<ext`:r=!0;break;case`</ext>`:r=!1;break;default:if(!r&&t.WTF)throw Error(`unrecognized `+c[0]+` in threaded comments`)}return o}),n}function Tl(e,t){var n=[],r=!1;return e.replace(wn,function(e){var i=q(e);switch(On(i[0])){case`<?xml`:break;case`<personList`:break;case`</personList>`:break;case`<person`:n.push({name:i.displayname,id:i.id});break;case`</person>`:break;case`<extLst`:case`<extLst>`:case`</extLst>`:case`<extLst/>`:break;case`<ext`:r=!0;break;case`</ext>`:r=!1;break;default:if(!r&&t.WTF)throw Error(`unrecognized `+i[0]+` in threaded comments`)}return e}),n}function El(e){var t={};t.iauthor=e.read_shift(4);var n=Ti(e,16);return t.rfx=n.s,t.ref=ti(n.s),e.l+=16,t}var Dl=pi;function Ol(e,t){var n=[],r=[],i={},a=!1;return zr(e,function(e,o,s){switch(s){case 632:r.push(e);break;case 635:i=e;break;case 637:i.t=e.t,i.h=e.h,i.r=e.r;break;case 636:if(i.author=r[i.iauthor],delete i.iauthor,t.sheetRows&&i.rfx&&t.sheetRows<=i.rfx.r)break;i.t||=``,delete i.rfx,n.push(i);break;case 3072:break;case 35:a=!0;break;case 36:a=!1;break;case 37:break;case 38:break;default:if(!o.T&&(!a||t.WTF))throw Error(`Unexpected record 0x`+s.toString(16))}}),n}var kl=`application/vnd.ms-office.vbaProject`;function Al(e){var t=K.utils.cfb_new({root:`R`});return e.FullPaths.forEach(function(n,r){if(!(n.slice(-1)===`/`||!n.match(/_VBA_PROJECT_CUR/))){var i=n.replace(/^[^\/]*/,`R`).replace(/\/_VBA_PROJECT_CUR\u0000*/,``);K.utils.cfb_add(t,i,e.FileIndex[r].content)}}),K.write(t)}function jl(){return{"!type":`dialog`}}function Ml(){return{"!type":`dialog`}}function Nl(){return{"!type":`macro`}}function Pl(){return{"!type":`macro`}}var Fl=(function(){var e=/(^|[^A-Za-z_])R(\[?-?\d+\]|[1-9]\d*|)C(\[?-?\d+\]|[1-9]\d*|)(?![A-Za-z0-9_])/g,t={r:0,c:0};function n(e,n,r,i){var a=!1,o=!1;r.length==0?o=!0:r.charAt(0)==`[`&&(o=!0,r=r.slice(1,-1)),i.length==0?a=!0:i.charAt(0)==`[`&&(a=!0,i=i.slice(1,-1));var s=r.length>0?parseInt(r,10)|0:0,c=i.length>0?parseInt(i,10)|0:0;return a?c+=t.c:--c,o?s+=t.r:--s,n+(a?``:`$`)+Xr(c)+(o?``:`$`)+Kr(s)}return function(r,i){return t=i,r.replace(e,n)}})(),Il=/(^|[^._A-Z0-9])(\$?)([A-Z]{1,2}|[A-W][A-Z]{2}|X[A-E][A-Z]|XF[A-D])(\$?)(\d{1,7})(?![_.\(A-Za-z0-9])/g;try{Il=/(^|[^._A-Z0-9])([$]?)([A-Z]{1,2}|[A-W][A-Z]{2}|X[A-E][A-Z]|XF[A-D])([$]?)(10[0-3]\d{4}|104[0-7]\d{3}|1048[0-4]\d{2}|10485[0-6]\d|104857[0-6]|[1-9]\d{0,5})(?![_.\(A-Za-z0-9])/g}catch{}var Ll=(function(){return function(e,t){return e.replace(Il,function(e,n,r,i,a,o){var s=Yr(i)-(r?0:t.c),c=Gr(o)-(a?0:t.r),l=a==`$`?c+1:c==0?``:`[`+c+`]`,u=r==`$`?s+1:s==0?``:`[`+s+`]`;return n+`R`+l+`C`+u})}})();function Rl(e,t){return e.replace(Il,function(e,n,r,i,a,o){return n+(r==`$`?r+i:Xr(Yr(i)+t.c))+(a==`$`?a+o:Kr(Gr(o)+t.r))})}function zl(e,t,n){var r=ni(t).s,i=ei(n);return Rl(e,{r:i.r-r.r,c:i.c-r.c})}function Bl(e){return e.length!=1}function Vl(e){return e.replace(/_xlfn\./g,``)}function Hl(e){e.l+=1}function Ul(e,t){var n=e.read_shift(t==1?1:2);return[n&16383,n>>14&1,n>>15&1]}function Wl(e,t,n){var r=2;if(n){if(n.biff>=2&&n.biff<=5)return Gl(e,t,n);n.biff==12&&(r=4)}var i=e.read_shift(r),a=e.read_shift(r),o=Ul(e,2),s=Ul(e,2);return{s:{r:i,c:o[0],cRel:o[1],rRel:o[2]},e:{r:a,c:s[0],cRel:s[1],rRel:s[2]}}}function Gl(e){var t=Ul(e,2),n=Ul(e,2),r=e.read_shift(1),i=e.read_shift(1);return{s:{r:t[0],c:r,cRel:t[1],rRel:t[2]},e:{r:n[0],c:i,cRel:n[1],rRel:n[2]}}}function Kl(e,t,n){if(n.biff<8)return Gl(e,t,n);var r=e.read_shift(n.biff==12?4:2),i=e.read_shift(n.biff==12?4:2),a=Ul(e,2),o=Ul(e,2);return{s:{r,c:a[0],cRel:a[1],rRel:a[2]},e:{r:i,c:o[0],cRel:o[1],rRel:o[2]}}}function ql(e,t,n){if(n&&n.biff>=2&&n.biff<=5)return Jl(e,t,n);var r=e.read_shift(n&&n.biff==12?4:2),i=Ul(e,2);return{r,c:i[0],cRel:i[1],rRel:i[2]}}function Jl(e){var t=Ul(e,2),n=e.read_shift(1);return{r:t[0],c:n,cRel:t[1],rRel:t[2]}}function Yl(e){var t=e.read_shift(2),n=e.read_shift(2);return{r:t,c:n&255,fQuoted:!!(n&16384),cRel:n>>15,rRel:n>>15}}function Xl(e,t,n){var r=n&&n.biff?n.biff:8;if(r>=2&&r<=5)return Zl(e,t,n);var i=e.read_shift(r>=12?4:2),a=e.read_shift(2),o=(a&16384)>>14,s=(a&32768)>>15;if(a&=16383,s==1)for(;i>524287;)i-=1048576;if(o==1)for(;a>8191;)a-=16384;return{r:i,c:a,cRel:o,rRel:s}}function Zl(e){var t=e.read_shift(2),n=e.read_shift(1),r=(t&32768)>>15,i=(t&16384)>>14;return t&=16383,r==1&&t>=8192&&(t-=16384),i==1&&n>=128&&(n-=256),{r:t,c:n,cRel:i,rRel:r}}function Ql(e,t,n){return[(e[e.l++]&96)>>5,Wl(e,n.biff>=2&&n.biff<=5?6:8,n)]}function $l(e,t,n){var r=(e[e.l++]&96)>>5,i=e.read_shift(2,`i`),a=8;if(n)switch(n.biff){case 5:e.l+=12,a=6;break;case 12:a=12;break}return[r,i,Wl(e,a,n)]}function eu(e,t,n){var r=(e[e.l++]&96)>>5;return e.l+=n&&n.biff>8?12:n.biff<8?6:8,[r]}function tu(e,t,n){var r=(e[e.l++]&96)>>5,i=e.read_shift(2),a=8;if(n)switch(n.biff){case 5:e.l+=12,a=6;break;case 12:a=12;break}return e.l+=a,[r,i]}function nu(e,t,n){return[(e[e.l++]&96)>>5,Kl(e,t-1,n)]}function ru(e,t,n){var r=(e[e.l++]&96)>>5;return e.l+=n.biff==2?6:n.biff==12?14:7,[r]}function iu(e){var t=e[e.l+1]&1;return e.l+=4,[t,1]}function au(e,t,n){e.l+=2;for(var r=e.read_shift(n&&n.biff==2?1:2),i=[],a=0;a<=r;++a)i.push(e.read_shift(n&&n.biff==2?1:2));return i}function ou(e,t,n){var r=e[e.l+1]&255?1:0;return e.l+=2,[r,e.read_shift(n&&n.biff==2?1:2)]}function su(e,t,n){var r=e[e.l+1]&255?1:0;return e.l+=2,[r,e.read_shift(n&&n.biff==2?1:2)]}function cu(e){var t=e[e.l+1]&255?1:0;return e.l+=2,[t,e.read_shift(2)]}function lu(e,t,n){var r=e[e.l+1]&255?1:0;return e.l+=n&&n.biff==2?3:4,[r]}function uu(e){return[e.read_shift(1),e.read_shift(1)]}function du(e){return e.read_shift(2),uu(e,2)}function fu(e){return e.read_shift(2),uu(e,2)}function pu(e,t,n){var r=(e[e.l]&96)>>5;return e.l+=1,[r,ql(e,0,n)]}function mu(e,t,n){var r=(e[e.l]&96)>>5;return e.l+=1,[r,Xl(e,0,n)]}function hu(e,t,n){var r=(e[e.l]&96)>>5;e.l+=1;var i=e.read_shift(2);return n&&n.biff==5&&(e.l+=12),[r,i,ql(e,0,n)]}function gu(e,t,n){var r=(e[e.l]&96)>>5;e.l+=1;var i=e.read_shift(n&&n.biff<=3?1:2);return[Ad[i],kd[i],r]}function _u(e,t,n){var r=e[e.l++],i=e.read_shift(1),a=n&&n.biff<=3?[r==88?-1:0,e.read_shift(1)]:vu(e);return[i,(a[0]===0?kd:Od)[a[1]]]}function vu(e){return[e[e.l+1]>>7,e.read_shift(2)&32767]}function yu(e,t,n){e.l+=n&&n.biff==2?3:4}function bu(e,t,n){return e.l++,n&&n.biff==12?[e.read_shift(4,`i`),0]:[e.read_shift(2),e.read_shift(n&&n.biff==2?1:2)]}function xu(e){return e.l++,Xi[e.read_shift(1)]}function Su(e){return e.l++,e.read_shift(2)}function Cu(e){return e.l++,e.read_shift(1)!==0}function wu(e){return e.l++,J(e,8)}function Tu(e,t,n){return e.l++,za(e,t-1,n)}function Eu(e,t){var n=[e.read_shift(1)];if(t==12)switch(n[0]){case 2:n[0]=4;break;case 4:n[0]=16;break;case 0:n[0]=1;break;case 1:n[0]=2;break}switch(n[0]){case 4:n[1]=Fa(e,1)?`TRUE`:`FALSE`,t!=12&&(e.l+=7);break;case 37:case 16:n[1]=Xi[e[e.l]],e.l+=t==12?4:8;break;case 0:e.l+=8;break;case 1:n[1]=J(e,8);break;case 2:n[1]=Ua(e,0,{biff:t>0&&t<8?2:t});break;default:throw Error(`Bad SerAr: `+n[0])}return n}function Du(e,t,n){for(var r=e.read_shift(n.biff==12?4:2),i=[],a=0;a!=r;++a)i.push((n.biff==12?Ti:Y)(e,8));return i}function Ou(e,t,n){var r=0,i=0;n.biff==12?(r=e.read_shift(4),i=e.read_shift(4)):(i=1+e.read_shift(1),r=1+e.read_shift(2)),n.biff>=2&&n.biff<8&&(--r,--i==0&&(i=256));for(var a=0,o=[];a!=r&&(o[a]=[]);++a)for(var s=0;s!=i;++s)o[a][s]=Eu(e,n.biff);return o}function ku(e,t,n){var r=e.read_shift(1)>>>5&3,i=!n||n.biff>=8?4:2,a=e.read_shift(i);switch(n.biff){case 2:e.l+=5;break;case 3:case 4:e.l+=8;break;case 5:e.l+=12;break}return[r,0,a]}function Au(e,t,n){return n.biff==5?ju(e,t,n):[e.read_shift(1)>>>5&3,e.read_shift(2),e.read_shift(4)]}function ju(e){var t=e.read_shift(1)>>>5&3,n=e.read_shift(2,`i`);e.l+=8;var r=e.read_shift(2);return e.l+=12,[t,n,r]}function Mu(e,t,n){var r=e.read_shift(1)>>>5&3;return e.l+=n&&n.biff==2?3:4,[r,e.read_shift(n&&n.biff==2?1:2)]}function Nu(e,t,n){return[e.read_shift(1)>>>5&3,e.read_shift(n&&n.biff==2?1:2)]}function Pu(e,t,n){var r=e.read_shift(1)>>>5&3;return e.l+=4,n.biff<8&&e.l--,n.biff==12&&(e.l+=2),[r]}function Fu(e,t,n){var r=(e[e.l++]&96)>>5,i=e.read_shift(2),a=4;if(n)switch(n.biff){case 5:a=15;break;case 12:a=6;break}return e.l+=a,[r,i]}var Iu=Lr,Lu=Lr,Ru=Lr;function zu(e,t,n){return e.l+=2,[Yl(e,4,n)]}function Bu(e){return e.l+=6,[]}var Vu=zu,Hu=Bu,Uu=Bu,Wu=zu;function Gu(e){return e.l+=2,[Ia(e),e.read_shift(2)&1]}var Ku=zu,qu=Gu,Ju=Bu,Yu=zu,Xu=zu,Zu=[`Data`,`All`,`Headers`,`??`,`?Data2`,`??`,`?DataHeaders`,`??`,`Totals`,`??`,`??`,`??`,`?DataTotals`,`??`,`??`,`??`,`?Current`];function Qu(e){e.l+=2;var t=e.read_shift(2),n=e.read_shift(2),r=e.read_shift(4),i=e.read_shift(2),a=e.read_shift(2),o=Zu[n>>2&31];return{ixti:t,coltype:n&3,rt:o,idx:r,c:i,C:a}}function $u(e){return e.l+=2,[e.read_shift(4)]}function ed(e,t,n){return e.l+=5,e.l+=2,e.l+=n.biff==2?1:4,[`PTGSHEET`]}function td(e,t,n){return e.l+=n.biff==2?4:5,[`PTGENDSHEET`]}function nd(e){return[e.read_shift(1)>>>5&3,e.read_shift(2)]}function rd(e){return[e.read_shift(1)>>>5&3,e.read_shift(2)]}function id(e){return e.l+=4,[0,0]}var ad={1:{n:`PtgExp`,f:bu},2:{n:`PtgTbl`,f:Ru},3:{n:`PtgAdd`,f:Hl},4:{n:`PtgSub`,f:Hl},5:{n:`PtgMul`,f:Hl},6:{n:`PtgDiv`,f:Hl},7:{n:`PtgPower`,f:Hl},8:{n:`PtgConcat`,f:Hl},9:{n:`PtgLt`,f:Hl},10:{n:`PtgLe`,f:Hl},11:{n:`PtgEq`,f:Hl},12:{n:`PtgGe`,f:Hl},13:{n:`PtgGt`,f:Hl},14:{n:`PtgNe`,f:Hl},15:{n:`PtgIsect`,f:Hl},16:{n:`PtgUnion`,f:Hl},17:{n:`PtgRange`,f:Hl},18:{n:`PtgUplus`,f:Hl},19:{n:`PtgUminus`,f:Hl},20:{n:`PtgPercent`,f:Hl},21:{n:`PtgParen`,f:Hl},22:{n:`PtgMissArg`,f:Hl},23:{n:`PtgStr`,f:Tu},26:{n:`PtgSheet`,f:ed},27:{n:`PtgEndSheet`,f:td},28:{n:`PtgErr`,f:xu},29:{n:`PtgBool`,f:Cu},30:{n:`PtgInt`,f:Su},31:{n:`PtgNum`,f:wu},32:{n:`PtgArray`,f:ru},33:{n:`PtgFunc`,f:gu},34:{n:`PtgFuncVar`,f:_u},35:{n:`PtgName`,f:ku},36:{n:`PtgRef`,f:pu},37:{n:`PtgArea`,f:Ql},38:{n:`PtgMemArea`,f:Mu},39:{n:`PtgMemErr`,f:Iu},40:{n:`PtgMemNoMem`,f:Lu},41:{n:`PtgMemFunc`,f:Nu},42:{n:`PtgRefErr`,f:Pu},43:{n:`PtgAreaErr`,f:eu},44:{n:`PtgRefN`,f:mu},45:{n:`PtgAreaN`,f:nu},46:{n:`PtgMemAreaN`,f:nd},47:{n:`PtgMemNoMemN`,f:rd},57:{n:`PtgNameX`,f:Au},58:{n:`PtgRef3d`,f:hu},59:{n:`PtgArea3d`,f:$l},60:{n:`PtgRefErr3d`,f:Fu},61:{n:`PtgAreaErr3d`,f:tu},255:{}},od={64:32,96:32,65:33,97:33,66:34,98:34,67:35,99:35,68:36,100:36,69:37,101:37,70:38,102:38,71:39,103:39,72:40,104:40,73:41,105:41,74:42,106:42,75:43,107:43,76:44,108:44,77:45,109:45,78:46,110:46,79:47,111:47,88:34,120:34,89:57,121:57,90:58,122:58,91:59,123:59,92:60,124:60,93:61,125:61},sd={1:{n:`PtgElfLel`,f:Gu},2:{n:`PtgElfRw`,f:Yu},3:{n:`PtgElfCol`,f:Vu},6:{n:`PtgElfRwV`,f:Xu},7:{n:`PtgElfColV`,f:Wu},10:{n:`PtgElfRadical`,f:Ku},11:{n:`PtgElfRadicalS`,f:Ju},13:{n:`PtgElfColS`,f:Hu},15:{n:`PtgElfColSV`,f:Uu},16:{n:`PtgElfRadicalLel`,f:qu},25:{n:`PtgList`,f:Qu},29:{n:`PtgSxName`,f:$u},255:{}},cd={0:{n:`PtgAttrNoop`,f:id},1:{n:`PtgAttrSemi`,f:lu},2:{n:`PtgAttrIf`,f:su},4:{n:`PtgAttrChoose`,f:au},8:{n:`PtgAttrGoto`,f:ou},16:{n:`PtgAttrSum`,f:yu},32:{n:`PtgAttrBaxcel`,f:iu},33:{n:`PtgAttrBaxcel`,f:iu},64:{n:`PtgAttrSpace`,f:du},65:{n:`PtgAttrSpaceSemi`,f:fu},128:{n:`PtgAttrIfError`,f:cu},255:{}};function ld(e,t,n,r){if(r.biff<8)return Lr(e,t);for(var i=e.l+t,a=[],o=0;o!==n.length;++o)switch(n[o][0]){case`PtgArray`:n[o][1]=Ou(e,0,r),a.push(n[o][1]);break;case`PtgMemArea`:n[o][2]=Du(e,n[o][1],r),a.push(n[o][2]);break;case`PtgExp`:r&&r.biff==12&&(n[o][1][1]=e.read_shift(4),a.push(n[o][1]));break;case`PtgList`:case`PtgElfRadicalS`:case`PtgElfColS`:case`PtgElfColSV`:throw`Unsupported `+n[o][0];default:break}return t=i-e.l,t!==0&&a.push(Lr(e,t)),a}function ud(e,t,n){for(var r=e.l+t,i,a,o=[];r!=e.l;)t=r-e.l,a=e[e.l],i=ad[a]||ad[od[a]],(a===24||a===25)&&(i=(a===24?sd:cd)[e[e.l+1]]),!i||!i.f?Lr(e,t):o.push([i.n,i.f(e,t,n)]);return o}function dd(e){for(var t=[],n=0;n<e.length;++n){for(var r=e[n],i=[],a=0;a<r.length;++a){var o=r[a];if(o)switch(o[0]){case 2:i.push(`"`+o[1].replace(/"/g,`""`)+`"`);break;default:i.push(o[1])}else i.push(``)}t.push(i.join(`,`))}return t.join(`;`)}var fd={PtgAdd:`+`,PtgConcat:`&`,PtgDiv:`/`,PtgEq:`=`,PtgGe:`>=`,PtgGt:`>`,PtgLe:`<=`,PtgLt:`<`,PtgMul:`*`,PtgNe:`<>`,PtgPower:`^`,PtgSub:`-`};function pd(e,t){var n=e.lastIndexOf(`!`),r=t.lastIndexOf(`!`);return n==-1&&r==-1?e+`:`+t:n>0&&r>0&&e.slice(0,n).toLowerCase()==t.slice(0,r).toLowerCase()?e+`:`+t.slice(r+1):(console.error(`Cannot hydrate range`,e,t),e+`:`+t)}function md(e,t,n){if(!e)return`SH33TJSERR0`;if(n.biff>8&&(!e.XTI||!e.XTI[t]))return e.SheetNames[t];if(!e.XTI)return`SH33TJSERR6`;var r=e.XTI[t];if(n.biff<8)return t>1e4&&(t-=65536),t<0&&(t=-t),t==0?``:e.XTI[t-1];if(!r)return`SH33TJSERR1`;var i=``;if(n.biff>8)switch(e[r[0]][0]){case 357:return i=r[1]==-1?`#REF`:e.SheetNames[r[1]],r[1]==r[2]?i:i+`:`+e.SheetNames[r[2]];case 358:return n.SID==null?`SH33TJSSAME`+e[r[0]][0]:e.SheetNames[n.SID];case 355:default:return`SH33TJSSRC`+e[r[0]][0]}switch(e[r[0]][0][0]){case 1025:return i=r[1]==-1?`#REF`:e.SheetNames[r[1]]||`SH33TJSERR3`,r[1]==r[2]?i:i+`:`+e.SheetNames[r[2]];case 14849:return e[r[0]].slice(1).map(function(e){return e.Name}).join(`;;`);default:return e[r[0]][0][3]?(i=r[1]==-1?`#REF`:e[r[0]][0][3][r[1]]||`SH33TJSERR4`,r[1]==r[2]?i:i+`:`+e[r[0]][0][3][r[2]]):`SH33TJSERR2`}}function hd(e,t,n){var r=md(e,t,n);return r==`#REF`?r:ii(r,n)}function gd(e,t,n,r,i){var a=i&&i.biff||8,o={s:{c:0,r:0},e:{c:0,r:0}},s=[],c,l,u,d=0,f=0,p,m=``;if(!e[0]||!e[0][0])return``;for(var h=-1,g=``,_=0,v=e[0].length;_<v;++_){var y=e[0][_];switch(y[0]){case`PtgUminus`:s.push(`-`+s.pop());break;case`PtgUplus`:s.push(`+`+s.pop());break;case`PtgPercent`:s.push(s.pop()+`%`);break;case`PtgAdd`:case`PtgConcat`:case`PtgDiv`:case`PtgEq`:case`PtgGe`:case`PtgGt`:case`PtgLe`:case`PtgLt`:case`PtgMul`:case`PtgNe`:case`PtgPower`:case`PtgSub`:if(c=s.pop(),l=s.pop(),h>=0){switch(e[0][h][1][0]){case 0:g=Bt(` `,e[0][h][1][1]);break;case 1:g=Bt(`\r`,e[0][h][1][1]);break;default:if(g=``,i.WTF)throw Error(`Unexpected PtgAttrSpaceType `+e[0][h][1][0])}l+=g,h=-1}s.push(l+fd[y[0]]+c);break;case`PtgIsect`:c=s.pop(),l=s.pop(),s.push(l+` `+c);break;case`PtgUnion`:c=s.pop(),l=s.pop(),s.push(l+`,`+c);break;case`PtgRange`:c=s.pop(),l=s.pop(),s.push(pd(l,c));break;case`PtgAttrChoose`:break;case`PtgAttrGoto`:break;case`PtgAttrIf`:break;case`PtgAttrIfError`:break;case`PtgRef`:u=Vr(y[1][1],o,i),s.push(Ur(u,a));break;case`PtgRefN`:u=n?Vr(y[1][1],n,i):y[1][1],s.push(Ur(u,a));break;case`PtgRef3d`:d=y[1][1],u=Vr(y[1][2],o,i),m=hd(r,d,i),s.push(m+`!`+Ur(u,a));break;case`PtgFunc`:case`PtgFuncVar`:var b=y[1][0],x=y[1][1];b||=0,b&=127;var S=b==0?[]:s.slice(-b);s.length-=b,x===`User`&&(x=S.shift()),s.push(x+`(`+S.join(`,`)+`)`);break;case`PtgBool`:s.push(y[1]?`TRUE`:`FALSE`);break;case`PtgInt`:s.push(y[1]);break;case`PtgNum`:s.push(String(y[1]));break;case`PtgStr`:s.push(`"`+y[1].replace(/"/g,`""`)+`"`);break;case`PtgErr`:s.push(y[1]);break;case`PtgAreaN`:p=Hr(y[1][1],n?{s:n}:o,i),s.push(Wr(p,i));break;case`PtgArea`:p=Hr(y[1][1],o,i),s.push(Wr(p,i));break;case`PtgArea3d`:d=y[1][1],p=y[1][2],m=hd(r,d,i),s.push(m+`!`+Wr(p,i));break;case`PtgAttrSum`:s.push(`SUM(`+s.pop()+`)`);break;case`PtgAttrBaxcel`:case`PtgAttrSemi`:break;case`PtgName`:f=y[1][2];var C=(r.names||[])[f-1]||(r[0]||[])[f],w=C?C.Name:`SH33TJSNAME`+String(f);w&&w.slice(0,6)==`_xlfn.`&&!i.xlfn&&(w=w.slice(6)),s.push(w);break;case`PtgNameX`:var T=y[1][1];f=y[1][2];var E;if(i.biff<=5)T<0&&(T=-T),r[T]&&(E=r[T][f]);else{var D=``;if(((r[T]||[])[0]||[])[0]==14849||(((r[T]||[])[0]||[])[0]==1025?r[T][f]&&r[T][f].itab>0&&(D=r.SheetNames[r[T][f].itab-1]+`!`):D=r.SheetNames[f-1]+`!`),r[T]&&r[T][f])D+=r[T][f].Name;else if(r[0]&&r[0][f])D+=r[0][f].Name;else{var O=(md(r,T,i)||``).split(`;;`);O[f-1]?D=O[f-1]:D+=`SH33TJSERRX`}s.push(D);break}E||={Name:`SH33TJSERRY`},s.push(E.Name);break;case`PtgParen`:var k=`(`,A=`)`;if(h>=0){switch(g=``,e[0][h][1][0]){case 2:k=Bt(` `,e[0][h][1][1])+k;break;case 3:k=Bt(`\r`,e[0][h][1][1])+k;break;case 4:A=Bt(` `,e[0][h][1][1])+A;break;case 5:A=Bt(`\r`,e[0][h][1][1])+A;break;default:if(i.WTF)throw Error(`Unexpected PtgAttrSpaceType `+e[0][h][1][0])}h=-1}s.push(k+s.pop()+A);break;case`PtgRefErr`:s.push(`#REF!`);break;case`PtgRefErr3d`:s.push(`#REF!`);break;case`PtgExp`:u={c:y[1][1],r:y[1][0]};var j={c:n.c,r:n.r};if(r.sharedf[ti(u)]){var M=r.sharedf[ti(u)];s.push(gd(M,o,j,r,i))}else{var N=!1;for(c=0;c!=r.arrayf.length;++c)if(l=r.arrayf[c],!(u.c<l[0].s.c||u.c>l[0].e.c)&&!(u.r<l[0].s.r||u.r>l[0].e.r)){s.push(gd(l[1],o,j,r,i)),N=!0;break}N||s.push(y[1])}break;case`PtgArray`:s.push(`{`+dd(y[1])+`}`);break;case`PtgMemArea`:break;case`PtgAttrSpace`:case`PtgAttrSpaceSemi`:h=_;break;case`PtgTbl`:break;case`PtgMemErr`:break;case`PtgMissArg`:s.push(``);break;case`PtgAreaErr`:s.push(`#REF!`);break;case`PtgAreaErr3d`:s.push(`#REF!`);break;case`PtgList`:s.push(`Table`+y[1].idx+`[#`+y[1].rt+`]`);break;case`PtgMemAreaN`:case`PtgMemNoMemN`:case`PtgAttrNoop`:case`PtgSheet`:case`PtgEndSheet`:break;case`PtgMemFunc`:break;case`PtgMemNoMem`:break;case`PtgElfCol`:case`PtgElfColS`:case`PtgElfColSV`:case`PtgElfColV`:case`PtgElfLel`:case`PtgElfRadical`:case`PtgElfRadicalLel`:case`PtgElfRadicalS`:case`PtgElfRw`:case`PtgElfRwV`:throw Error(`Unsupported ELFs`);case`PtgSxName`:throw Error(`Unrecognized Formula Token: `+String(y));default:throw Error(`Unrecognized Formula Token: `+String(y))}if(i.biff!=3&&h>=0&&[`PtgAttrSpace`,`PtgAttrSpaceSemi`,`PtgAttrGoto`].indexOf(e[0][_][0])==-1){y=e[0][h];var P=!0;switch(y[1][0]){case 4:P=!1;case 0:g=Bt(` `,y[1][1]);break;case 5:P=!1;case 1:g=Bt(`\r`,y[1][1]);break;default:if(g=``,i.WTF)throw Error(`Unexpected PtgAttrSpaceType `+y[1][0])}s.push((P?g:``)+s.pop()+(P?``:g)),h=-1}}if(s.length>1&&i.WTF)throw Error(`bad formula stack`);return s[0]==`TRUE`||s[0]!=`FALSE`&&s[0]}function _d(e,t,n){var r=e.l+t,i=n.biff==2?1:2,a,o=e.read_shift(i);if(o==65535)return[[],Lr(e,t-2)];var s=ud(e,o,n);return t!==o+i&&(a=ld(e,t-o-i,s,n)),e.l=r,[s,a]}function vd(e,t,n){var r=e.l+t,i=n.biff==2?1:2,a,o=e.read_shift(i);if(o==65535)return[[],Lr(e,t-2)];var s=ud(e,o,n);return t!==o+i&&(a=ld(e,t-o-i,s,n)),e.l=r,[s,a]}function yd(e,t,n,r){var i=e.l+t,a=ud(e,r,n),o;return i!==e.l&&(o=ld(e,i-e.l,a,n)),[a,o]}function bd(e,t,n){var r=e.l+t,i,a=e.read_shift(2),o=ud(e,a,n);return a==65535?[[],Lr(e,t-2)]:(t!==a+2&&(i=ld(e,r-a-2,o,n)),[o,i])}function xd(e){var t;if(Tr(e,e.l+6)!==65535)return[J(e),`n`];switch(e[e.l]){case 0:return e.l+=8,[`String`,`s`];case 1:return t=e[e.l+2]===1,e.l+=8,[t,`b`];case 2:return t=e[e.l+2],e.l+=8,[t,`e`];case 3:return e.l+=8,[``,`s`]}return[]}function Sd(e,t,n){var r=e.l+t,i=Qa(e,6,n),a=xd(e,8),o=e.read_shift(1);n.biff!=2&&(e.read_shift(1),n.biff>=5&&e.read_shift(4));var s=vd(e,r-e.l,n);return{cell:i,val:a[0],formula:s,shared:o>>3&1,tt:a[1]}}function Cd(e,t,n){var r=ud(e,e.read_shift(4),n),i=e.read_shift(4);return[r,i>0?ld(e,i,r,n):null]}var wd=Cd,Td=Cd,Ed=Cd,Dd=Cd,Od={0:`BEEP`,1:`OPEN`,2:`OPEN.LINKS`,3:`CLOSE.ALL`,4:`SAVE`,5:`SAVE.AS`,6:`FILE.DELETE`,7:`PAGE.SETUP`,8:`PRINT`,9:`PRINTER.SETUP`,10:`QUIT`,11:`NEW.WINDOW`,12:`ARRANGE.ALL`,13:`WINDOW.SIZE`,14:`WINDOW.MOVE`,15:`FULL`,16:`CLOSE`,17:`RUN`,22:`SET.PRINT.AREA`,23:`SET.PRINT.TITLES`,24:`SET.PAGE.BREAK`,25:`REMOVE.PAGE.BREAK`,26:`FONT`,27:`DISPLAY`,28:`PROTECT.DOCUMENT`,29:`PRECISION`,30:`A1.R1C1`,31:`CALCULATE.NOW`,32:`CALCULATION`,34:`DATA.FIND`,35:`EXTRACT`,36:`DATA.DELETE`,37:`SET.DATABASE`,38:`SET.CRITERIA`,39:`SORT`,40:`DATA.SERIES`,41:`TABLE`,42:`FORMAT.NUMBER`,43:`ALIGNMENT`,44:`STYLE`,45:`BORDER`,46:`CELL.PROTECTION`,47:`COLUMN.WIDTH`,48:`UNDO`,49:`CUT`,50:`COPY`,51:`PASTE`,52:`CLEAR`,53:`PASTE.SPECIAL`,54:`EDIT.DELETE`,55:`INSERT`,56:`FILL.RIGHT`,57:`FILL.DOWN`,61:`DEFINE.NAME`,62:`CREATE.NAMES`,63:`FORMULA.GOTO`,64:`FORMULA.FIND`,65:`SELECT.LAST.CELL`,66:`SHOW.ACTIVE.CELL`,67:`GALLERY.AREA`,68:`GALLERY.BAR`,69:`GALLERY.COLUMN`,70:`GALLERY.LINE`,71:`GALLERY.PIE`,72:`GALLERY.SCATTER`,73:`COMBINATION`,74:`PREFERRED`,75:`ADD.OVERLAY`,76:`GRIDLINES`,77:`SET.PREFERRED`,78:`AXES`,79:`LEGEND`,80:`ATTACH.TEXT`,81:`ADD.ARROW`,82:`SELECT.CHART`,83:`SELECT.PLOT.AREA`,84:`PATTERNS`,85:`MAIN.CHART`,86:`OVERLAY`,87:`SCALE`,88:`FORMAT.LEGEND`,89:`FORMAT.TEXT`,90:`EDIT.REPEAT`,91:`PARSE`,92:`JUSTIFY`,93:`HIDE`,94:`UNHIDE`,95:`WORKSPACE`,96:`FORMULA`,97:`FORMULA.FILL`,98:`FORMULA.ARRAY`,99:`DATA.FIND.NEXT`,100:`DATA.FIND.PREV`,101:`FORMULA.FIND.NEXT`,102:`FORMULA.FIND.PREV`,103:`ACTIVATE`,104:`ACTIVATE.NEXT`,105:`ACTIVATE.PREV`,106:`UNLOCKED.NEXT`,107:`UNLOCKED.PREV`,108:`COPY.PICTURE`,109:`SELECT`,110:`DELETE.NAME`,111:`DELETE.FORMAT`,112:`VLINE`,113:`HLINE`,114:`VPAGE`,115:`HPAGE`,116:`VSCROLL`,117:`HSCROLL`,118:`ALERT`,119:`NEW`,120:`CANCEL.COPY`,121:`SHOW.CLIPBOARD`,122:`MESSAGE`,124:`PASTE.LINK`,125:`APP.ACTIVATE`,126:`DELETE.ARROW`,127:`ROW.HEIGHT`,128:`FORMAT.MOVE`,129:`FORMAT.SIZE`,130:`FORMULA.REPLACE`,131:`SEND.KEYS`,132:`SELECT.SPECIAL`,133:`APPLY.NAMES`,134:`REPLACE.FONT`,135:`FREEZE.PANES`,136:`SHOW.INFO`,137:`SPLIT`,138:`ON.WINDOW`,139:`ON.DATA`,140:`DISABLE.INPUT`,142:`OUTLINE`,143:`LIST.NAMES`,144:`FILE.CLOSE`,145:`SAVE.WORKBOOK`,146:`DATA.FORM`,147:`COPY.CHART`,148:`ON.TIME`,149:`WAIT`,150:`FORMAT.FONT`,151:`FILL.UP`,152:`FILL.LEFT`,153:`DELETE.OVERLAY`,155:`SHORT.MENUS`,159:`SET.UPDATE.STATUS`,161:`COLOR.PALETTE`,162:`DELETE.STYLE`,163:`WINDOW.RESTORE`,164:`WINDOW.MAXIMIZE`,166:`CHANGE.LINK`,167:`CALCULATE.DOCUMENT`,168:`ON.KEY`,169:`APP.RESTORE`,170:`APP.MOVE`,171:`APP.SIZE`,172:`APP.MINIMIZE`,173:`APP.MAXIMIZE`,174:`BRING.TO.FRONT`,175:`SEND.TO.BACK`,185:`MAIN.CHART.TYPE`,186:`OVERLAY.CHART.TYPE`,187:`SELECT.END`,188:`OPEN.MAIL`,189:`SEND.MAIL`,190:`STANDARD.FONT`,191:`CONSOLIDATE`,192:`SORT.SPECIAL`,193:`GALLERY.3D.AREA`,194:`GALLERY.3D.COLUMN`,195:`GALLERY.3D.LINE`,196:`GALLERY.3D.PIE`,197:`VIEW.3D`,198:`GOAL.SEEK`,199:`WORKGROUP`,200:`FILL.GROUP`,201:`UPDATE.LINK`,202:`PROMOTE`,203:`DEMOTE`,204:`SHOW.DETAIL`,206:`UNGROUP`,207:`OBJECT.PROPERTIES`,208:`SAVE.NEW.OBJECT`,209:`SHARE`,210:`SHARE.NAME`,211:`DUPLICATE`,212:`APPLY.STYLE`,213:`ASSIGN.TO.OBJECT`,214:`OBJECT.PROTECTION`,215:`HIDE.OBJECT`,216:`SET.EXTRACT`,217:`CREATE.PUBLISHER`,218:`SUBSCRIBE.TO`,219:`ATTRIBUTES`,220:`SHOW.TOOLBAR`,222:`PRINT.PREVIEW`,223:`EDIT.COLOR`,224:`SHOW.LEVELS`,225:`FORMAT.MAIN`,226:`FORMAT.OVERLAY`,227:`ON.RECALC`,228:`EDIT.SERIES`,229:`DEFINE.STYLE`,240:`LINE.PRINT`,243:`ENTER.DATA`,249:`GALLERY.RADAR`,250:`MERGE.STYLES`,251:`EDITION.OPTIONS`,252:`PASTE.PICTURE`,253:`PASTE.PICTURE.LINK`,254:`SPELLING`,256:`ZOOM`,259:`INSERT.OBJECT`,260:`WINDOW.MINIMIZE`,265:`SOUND.NOTE`,266:`SOUND.PLAY`,267:`FORMAT.SHAPE`,268:`EXTEND.POLYGON`,269:`FORMAT.AUTO`,272:`GALLERY.3D.BAR`,273:`GALLERY.3D.SURFACE`,274:`FILL.AUTO`,276:`CUSTOMIZE.TOOLBAR`,277:`ADD.TOOL`,278:`EDIT.OBJECT`,279:`ON.DOUBLECLICK`,280:`ON.ENTRY`,281:`WORKBOOK.ADD`,282:`WORKBOOK.MOVE`,283:`WORKBOOK.COPY`,284:`WORKBOOK.OPTIONS`,285:`SAVE.WORKSPACE`,288:`CHART.WIZARD`,289:`DELETE.TOOL`,290:`MOVE.TOOL`,291:`WORKBOOK.SELECT`,292:`WORKBOOK.ACTIVATE`,293:`ASSIGN.TO.TOOL`,295:`COPY.TOOL`,296:`RESET.TOOL`,297:`CONSTRAIN.NUMERIC`,298:`PASTE.TOOL`,302:`WORKBOOK.NEW`,305:`SCENARIO.CELLS`,306:`SCENARIO.DELETE`,307:`SCENARIO.ADD`,308:`SCENARIO.EDIT`,309:`SCENARIO.SHOW`,310:`SCENARIO.SHOW.NEXT`,311:`SCENARIO.SUMMARY`,312:`PIVOT.TABLE.WIZARD`,313:`PIVOT.FIELD.PROPERTIES`,314:`PIVOT.FIELD`,315:`PIVOT.ITEM`,316:`PIVOT.ADD.FIELDS`,318:`OPTIONS.CALCULATION`,319:`OPTIONS.EDIT`,320:`OPTIONS.VIEW`,321:`ADDIN.MANAGER`,322:`MENU.EDITOR`,323:`ATTACH.TOOLBARS`,324:`VBAActivate`,325:`OPTIONS.CHART`,328:`VBA.INSERT.FILE`,330:`VBA.PROCEDURE.DEFINITION`,336:`ROUTING.SLIP`,338:`ROUTE.DOCUMENT`,339:`MAIL.LOGON`,342:`INSERT.PICTURE`,343:`EDIT.TOOL`,344:`GALLERY.DOUGHNUT`,350:`CHART.TREND`,352:`PIVOT.ITEM.PROPERTIES`,354:`WORKBOOK.INSERT`,355:`OPTIONS.TRANSITION`,356:`OPTIONS.GENERAL`,370:`FILTER.ADVANCED`,373:`MAIL.ADD.MAILER`,374:`MAIL.DELETE.MAILER`,375:`MAIL.REPLY`,376:`MAIL.REPLY.ALL`,377:`MAIL.FORWARD`,378:`MAIL.NEXT.LETTER`,379:`DATA.LABEL`,380:`INSERT.TITLE`,381:`FONT.PROPERTIES`,382:`MACRO.OPTIONS`,383:`WORKBOOK.HIDE`,384:`WORKBOOK.UNHIDE`,385:`WORKBOOK.DELETE`,386:`WORKBOOK.NAME`,388:`GALLERY.CUSTOM`,390:`ADD.CHART.AUTOFORMAT`,391:`DELETE.CHART.AUTOFORMAT`,392:`CHART.ADD.DATA`,393:`AUTO.OUTLINE`,394:`TAB.ORDER`,395:`SHOW.DIALOG`,396:`SELECT.ALL`,397:`UNGROUP.SHEETS`,398:`SUBTOTAL.CREATE`,399:`SUBTOTAL.REMOVE`,400:`RENAME.OBJECT`,412:`WORKBOOK.SCROLL`,413:`WORKBOOK.NEXT`,414:`WORKBOOK.PREV`,415:`WORKBOOK.TAB.SPLIT`,416:`FULL.SCREEN`,417:`WORKBOOK.PROTECT`,420:`SCROLLBAR.PROPERTIES`,421:`PIVOT.SHOW.PAGES`,422:`TEXT.TO.COLUMNS`,423:`FORMAT.CHARTTYPE`,424:`LINK.FORMAT`,425:`TRACER.DISPLAY`,430:`TRACER.NAVIGATE`,431:`TRACER.CLEAR`,432:`TRACER.ERROR`,433:`PIVOT.FIELD.GROUP`,434:`PIVOT.FIELD.UNGROUP`,435:`CHECKBOX.PROPERTIES`,436:`LABEL.PROPERTIES`,437:`LISTBOX.PROPERTIES`,438:`EDITBOX.PROPERTIES`,439:`PIVOT.REFRESH`,440:`LINK.COMBO`,441:`OPEN.TEXT`,442:`HIDE.DIALOG`,443:`SET.DIALOG.FOCUS`,444:`ENABLE.OBJECT`,445:`PUSHBUTTON.PROPERTIES`,446:`SET.DIALOG.DEFAULT`,447:`FILTER`,448:`FILTER.SHOW.ALL`,449:`CLEAR.OUTLINE`,450:`FUNCTION.WIZARD`,451:`ADD.LIST.ITEM`,452:`SET.LIST.ITEM`,453:`REMOVE.LIST.ITEM`,454:`SELECT.LIST.ITEM`,455:`SET.CONTROL.VALUE`,456:`SAVE.COPY.AS`,458:`OPTIONS.LISTS.ADD`,459:`OPTIONS.LISTS.DELETE`,460:`SERIES.AXES`,461:`SERIES.X`,462:`SERIES.Y`,463:`ERRORBAR.X`,464:`ERRORBAR.Y`,465:`FORMAT.CHART`,466:`SERIES.ORDER`,467:`MAIL.LOGOFF`,468:`CLEAR.ROUTING.SLIP`,469:`APP.ACTIVATE.MICROSOFT`,470:`MAIL.EDIT.MAILER`,471:`ON.SHEET`,472:`STANDARD.WIDTH`,473:`SCENARIO.MERGE`,474:`SUMMARY.INFO`,475:`FIND.FILE`,476:`ACTIVE.CELL.FONT`,477:`ENABLE.TIPWIZARD`,478:`VBA.MAKE.ADDIN`,480:`INSERTDATATABLE`,481:`WORKGROUP.OPTIONS`,482:`MAIL.SEND.MAILER`,485:`AUTOCORRECT`,489:`POST.DOCUMENT`,491:`PICKLIST`,493:`VIEW.SHOW`,494:`VIEW.DEFINE`,495:`VIEW.DELETE`,509:`SHEET.BACKGROUND`,510:`INSERT.MAP.OBJECT`,511:`OPTIONS.MENONO`,517:`MSOCHECKS`,518:`NORMAL`,519:`LAYOUT`,520:`RM.PRINT.AREA`,521:`CLEAR.PRINT.AREA`,522:`ADD.PRINT.AREA`,523:`MOVE.BRK`,545:`HIDECURR.NOTE`,546:`HIDEALL.NOTES`,547:`DELETE.NOTE`,548:`TRAVERSE.NOTES`,549:`ACTIVATE.NOTES`,620:`PROTECT.REVISIONS`,621:`UNPROTECT.REVISIONS`,647:`OPTIONS.ME`,653:`WEB.PUBLISH`,667:`NEWWEBQUERY`,673:`PIVOT.TABLE.CHART`,753:`OPTIONS.SAVE`,755:`OPTIONS.SPELL`,808:`HIDEALL.INKANNOTS`},kd={0:`COUNT`,1:`IF`,2:`ISNA`,3:`ISERROR`,4:`SUM`,5:`AVERAGE`,6:`MIN`,7:`MAX`,8:`ROW`,9:`COLUMN`,10:`NA`,11:`NPV`,12:`STDEV`,13:`DOLLAR`,14:`FIXED`,15:`SIN`,16:`COS`,17:`TAN`,18:`ATAN`,19:`PI`,20:`SQRT`,21:`EXP`,22:`LN`,23:`LOG10`,24:`ABS`,25:`INT`,26:`SIGN`,27:`ROUND`,28:`LOOKUP`,29:`INDEX`,30:`REPT`,31:`MID`,32:`LEN`,33:`VALUE`,34:`TRUE`,35:`FALSE`,36:`AND`,37:`OR`,38:`NOT`,39:`MOD`,40:`DCOUNT`,41:`DSUM`,42:`DAVERAGE`,43:`DMIN`,44:`DMAX`,45:`DSTDEV`,46:`VAR`,47:`DVAR`,48:`TEXT`,49:`LINEST`,50:`TREND`,51:`LOGEST`,52:`GROWTH`,53:`GOTO`,54:`HALT`,55:`RETURN`,56:`PV`,57:`FV`,58:`NPER`,59:`PMT`,60:`RATE`,61:`MIRR`,62:`IRR`,63:`RAND`,64:`MATCH`,65:`DATE`,66:`TIME`,67:`DAY`,68:`MONTH`,69:`YEAR`,70:`WEEKDAY`,71:`HOUR`,72:`MINUTE`,73:`SECOND`,74:`NOW`,75:`AREAS`,76:`ROWS`,77:`COLUMNS`,78:`OFFSET`,79:`ABSREF`,80:`RELREF`,81:`ARGUMENT`,82:`SEARCH`,83:`TRANSPOSE`,84:`ERROR`,85:`STEP`,86:`TYPE`,87:`ECHO`,88:`SET.NAME`,89:`CALLER`,90:`DEREF`,91:`WINDOWS`,92:`SERIES`,93:`DOCUMENTS`,94:`ACTIVE.CELL`,95:`SELECTION`,96:`RESULT`,97:`ATAN2`,98:`ASIN`,99:`ACOS`,100:`CHOOSE`,101:`HLOOKUP`,102:`VLOOKUP`,103:`LINKS`,104:`INPUT`,105:`ISREF`,106:`GET.FORMULA`,107:`GET.NAME`,108:`SET.VALUE`,109:`LOG`,110:`EXEC`,111:`CHAR`,112:`LOWER`,113:`UPPER`,114:`PROPER`,115:`LEFT`,116:`RIGHT`,117:`EXACT`,118:`TRIM`,119:`REPLACE`,120:`SUBSTITUTE`,121:`CODE`,122:`NAMES`,123:`DIRECTORY`,124:`FIND`,125:`CELL`,126:`ISERR`,127:`ISTEXT`,128:`ISNUMBER`,129:`ISBLANK`,130:`T`,131:`N`,132:`FOPEN`,133:`FCLOSE`,134:`FSIZE`,135:`FREADLN`,136:`FREAD`,137:`FWRITELN`,138:`FWRITE`,139:`FPOS`,140:`DATEVALUE`,141:`TIMEVALUE`,142:`SLN`,143:`SYD`,144:`DDB`,145:`GET.DEF`,146:`REFTEXT`,147:`TEXTREF`,148:`INDIRECT`,149:`REGISTER`,150:`CALL`,151:`ADD.BAR`,152:`ADD.MENU`,153:`ADD.COMMAND`,154:`ENABLE.COMMAND`,155:`CHECK.COMMAND`,156:`RENAME.COMMAND`,157:`SHOW.BAR`,158:`DELETE.MENU`,159:`DELETE.COMMAND`,160:`GET.CHART.ITEM`,161:`DIALOG.BOX`,162:`CLEAN`,163:`MDETERM`,164:`MINVERSE`,165:`MMULT`,166:`FILES`,167:`IPMT`,168:`PPMT`,169:`COUNTA`,170:`CANCEL.KEY`,171:`FOR`,172:`WHILE`,173:`BREAK`,174:`NEXT`,175:`INITIATE`,176:`REQUEST`,177:`POKE`,178:`EXECUTE`,179:`TERMINATE`,180:`RESTART`,181:`HELP`,182:`GET.BAR`,183:`PRODUCT`,184:`FACT`,185:`GET.CELL`,186:`GET.WORKSPACE`,187:`GET.WINDOW`,188:`GET.DOCUMENT`,189:`DPRODUCT`,190:`ISNONTEXT`,191:`GET.NOTE`,192:`NOTE`,193:`STDEVP`,194:`VARP`,195:`DSTDEVP`,196:`DVARP`,197:`TRUNC`,198:`ISLOGICAL`,199:`DCOUNTA`,200:`DELETE.BAR`,201:`UNREGISTER`,204:`USDOLLAR`,205:`FINDB`,206:`SEARCHB`,207:`REPLACEB`,208:`LEFTB`,209:`RIGHTB`,210:`MIDB`,211:`LENB`,212:`ROUNDUP`,213:`ROUNDDOWN`,214:`ASC`,215:`DBCS`,216:`RANK`,219:`ADDRESS`,220:`DAYS360`,221:`TODAY`,222:`VDB`,223:`ELSE`,224:`ELSE.IF`,225:`END.IF`,226:`FOR.CELL`,227:`MEDIAN`,228:`SUMPRODUCT`,229:`SINH`,230:`COSH`,231:`TANH`,232:`ASINH`,233:`ACOSH`,234:`ATANH`,235:`DGET`,236:`CREATE.OBJECT`,237:`VOLATILE`,238:`LAST.ERROR`,239:`CUSTOM.UNDO`,240:`CUSTOM.REPEAT`,241:`FORMULA.CONVERT`,242:`GET.LINK.INFO`,243:`TEXT.BOX`,244:`INFO`,245:`GROUP`,246:`GET.OBJECT`,247:`DB`,248:`PAUSE`,251:`RESUME`,252:`FREQUENCY`,253:`ADD.TOOLBAR`,254:`DELETE.TOOLBAR`,255:`User`,256:`RESET.TOOLBAR`,257:`EVALUATE`,258:`GET.TOOLBAR`,259:`GET.TOOL`,260:`SPELLING.CHECK`,261:`ERROR.TYPE`,262:`APP.TITLE`,263:`WINDOW.TITLE`,264:`SAVE.TOOLBAR`,265:`ENABLE.TOOL`,266:`PRESS.TOOL`,267:`REGISTER.ID`,268:`GET.WORKBOOK`,269:`AVEDEV`,270:`BETADIST`,271:`GAMMALN`,272:`BETAINV`,273:`BINOMDIST`,274:`CHIDIST`,275:`CHIINV`,276:`COMBIN`,277:`CONFIDENCE`,278:`CRITBINOM`,279:`EVEN`,280:`EXPONDIST`,281:`FDIST`,282:`FINV`,283:`FISHER`,284:`FISHERINV`,285:`FLOOR`,286:`GAMMADIST`,287:`GAMMAINV`,288:`CEILING`,289:`HYPGEOMDIST`,290:`LOGNORMDIST`,291:`LOGINV`,292:`NEGBINOMDIST`,293:`NORMDIST`,294:`NORMSDIST`,295:`NORMINV`,296:`NORMSINV`,297:`STANDARDIZE`,298:`ODD`,299:`PERMUT`,300:`POISSON`,301:`TDIST`,302:`WEIBULL`,303:`SUMXMY2`,304:`SUMX2MY2`,305:`SUMX2PY2`,306:`CHITEST`,307:`CORREL`,308:`COVAR`,309:`FORECAST`,310:`FTEST`,311:`INTERCEPT`,312:`PEARSON`,313:`RSQ`,314:`STEYX`,315:`SLOPE`,316:`TTEST`,317:`PROB`,318:`DEVSQ`,319:`GEOMEAN`,320:`HARMEAN`,321:`SUMSQ`,322:`KURT`,323:`SKEW`,324:`ZTEST`,325:`LARGE`,326:`SMALL`,327:`QUARTILE`,328:`PERCENTILE`,329:`PERCENTRANK`,330:`MODE`,331:`TRIMMEAN`,332:`TINV`,334:`MOVIE.COMMAND`,335:`GET.MOVIE`,336:`CONCATENATE`,337:`POWER`,338:`PIVOT.ADD.DATA`,339:`GET.PIVOT.TABLE`,340:`GET.PIVOT.FIELD`,341:`GET.PIVOT.ITEM`,342:`RADIANS`,343:`DEGREES`,344:`SUBTOTAL`,345:`SUMIF`,346:`COUNTIF`,347:`COUNTBLANK`,348:`SCENARIO.GET`,349:`OPTIONS.LISTS.GET`,350:`ISPMT`,351:`DATEDIF`,352:`DATESTRING`,353:`NUMBERSTRING`,354:`ROMAN`,355:`OPEN.DIALOG`,356:`SAVE.DIALOG`,357:`VIEW.GET`,358:`GETPIVOTDATA`,359:`HYPERLINK`,360:`PHONETIC`,361:`AVERAGEA`,362:`MAXA`,363:`MINA`,364:`STDEVPA`,365:`VARPA`,366:`STDEVA`,367:`VARA`,368:`BAHTTEXT`,369:`THAIDAYOFWEEK`,370:`THAIDIGIT`,371:`THAIMONTHOFYEAR`,372:`THAINUMSOUND`,373:`THAINUMSTRING`,374:`THAISTRINGLENGTH`,375:`ISTHAIDIGIT`,376:`ROUNDBAHTDOWN`,377:`ROUNDBAHTUP`,378:`THAIYEAR`,379:`RTD`,380:`CUBEVALUE`,381:`CUBEMEMBER`,382:`CUBEMEMBERPROPERTY`,383:`CUBERANKEDMEMBER`,384:`HEX2BIN`,385:`HEX2DEC`,386:`HEX2OCT`,387:`DEC2BIN`,388:`DEC2HEX`,389:`DEC2OCT`,390:`OCT2BIN`,391:`OCT2HEX`,392:`OCT2DEC`,393:`BIN2DEC`,394:`BIN2OCT`,395:`BIN2HEX`,396:`IMSUB`,397:`IMDIV`,398:`IMPOWER`,399:`IMABS`,400:`IMSQRT`,401:`IMLN`,402:`IMLOG2`,403:`IMLOG10`,404:`IMSIN`,405:`IMCOS`,406:`IMEXP`,407:`IMARGUMENT`,408:`IMCONJUGATE`,409:`IMAGINARY`,410:`IMREAL`,411:`COMPLEX`,412:`IMSUM`,413:`IMPRODUCT`,414:`SERIESSUM`,415:`FACTDOUBLE`,416:`SQRTPI`,417:`QUOTIENT`,418:`DELTA`,419:`GESTEP`,420:`ISEVEN`,421:`ISODD`,422:`MROUND`,423:`ERF`,424:`ERFC`,425:`BESSELJ`,426:`BESSELK`,427:`BESSELY`,428:`BESSELI`,429:`XIRR`,430:`XNPV`,431:`PRICEMAT`,432:`YIELDMAT`,433:`INTRATE`,434:`RECEIVED`,435:`DISC`,436:`PRICEDISC`,437:`YIELDDISC`,438:`TBILLEQ`,439:`TBILLPRICE`,440:`TBILLYIELD`,441:`PRICE`,442:`YIELD`,443:`DOLLARDE`,444:`DOLLARFR`,445:`NOMINAL`,446:`EFFECT`,447:`CUMPRINC`,448:`CUMIPMT`,449:`EDATE`,450:`EOMONTH`,451:`YEARFRAC`,452:`COUPDAYBS`,453:`COUPDAYS`,454:`COUPDAYSNC`,455:`COUPNCD`,456:`COUPNUM`,457:`COUPPCD`,458:`DURATION`,459:`MDURATION`,460:`ODDLPRICE`,461:`ODDLYIELD`,462:`ODDFPRICE`,463:`ODDFYIELD`,464:`RANDBETWEEN`,465:`WEEKNUM`,466:`AMORDEGRC`,467:`AMORLINC`,468:`CONVERT`,724:`SHEETJS`,469:`ACCRINT`,470:`ACCRINTM`,471:`WORKDAY`,472:`NETWORKDAYS`,473:`GCD`,474:`MULTINOMIAL`,475:`LCM`,476:`FVSCHEDULE`,477:`CUBEKPIMEMBER`,478:`CUBESET`,479:`CUBESETCOUNT`,480:`IFERROR`,481:`COUNTIFS`,482:`SUMIFS`,483:`AVERAGEIF`,484:`AVERAGEIFS`},Ad={2:1,3:1,10:0,15:1,16:1,17:1,18:1,19:0,20:1,21:1,22:1,23:1,24:1,25:1,26:1,27:2,30:2,31:3,32:1,33:1,34:0,35:0,38:1,39:2,40:3,41:3,42:3,43:3,44:3,45:3,47:3,48:2,53:1,61:3,63:0,65:3,66:3,67:1,68:1,69:1,70:1,71:1,72:1,73:1,74:0,75:1,76:1,77:1,79:2,80:2,83:1,85:0,86:1,89:0,90:1,94:0,95:0,97:2,98:1,99:1,101:3,102:3,105:1,106:1,108:2,111:1,112:1,113:1,114:1,117:2,118:1,119:4,121:1,126:1,127:1,128:1,129:1,130:1,131:1,133:1,134:1,135:1,136:2,137:2,138:2,140:1,141:1,142:3,143:4,144:4,161:1,162:1,163:1,164:1,165:2,172:1,175:2,176:2,177:3,178:2,179:1,184:1,186:1,189:3,190:1,195:3,196:3,197:1,198:1,199:3,201:1,207:4,210:3,211:1,212:2,213:2,214:1,215:1,225:0,229:1,230:1,231:1,232:1,233:1,234:1,235:3,244:1,247:4,252:2,257:1,261:1,271:1,273:4,274:2,275:2,276:2,277:3,278:3,279:1,280:3,281:3,282:3,283:1,284:1,285:2,286:4,287:3,288:2,289:4,290:3,291:3,292:3,293:4,294:1,295:3,296:1,297:3,298:1,299:2,300:3,301:3,302:4,303:2,304:2,305:2,306:2,307:2,308:2,309:3,310:2,311:2,312:2,313:2,314:2,315:2,316:4,325:2,326:2,327:2,328:2,331:2,332:2,337:2,342:1,343:1,346:2,347:1,350:4,351:3,352:1,353:2,360:1,368:1,369:1,370:1,371:1,372:1,373:1,374:1,375:1,376:1,377:1,378:1,382:3,385:1,392:1,393:1,396:2,397:2,398:2,399:1,400:1,401:1,402:1,403:1,404:1,405:1,406:1,407:1,408:1,409:1,410:1,414:4,415:1,416:1,417:2,420:1,421:1,422:2,424:1,425:2,426:2,427:2,428:2,430:3,438:3,439:3,440:3,443:2,444:2,445:2,446:2,447:6,448:6,449:2,450:2,464:2,468:3,476:2,479:1,480:2,65535:0};function jd(e){return e.slice(0,3)==`of:`&&(e=e.slice(3)),e.charCodeAt(0)==61&&(e=e.slice(1),e.charCodeAt(0)==61&&(e=e.slice(1))),e=e.replace(/COM\.MICROSOFT\./g,``),e=e.replace(/\[((?:\.[A-Z]+[0-9]+)(?::\.[A-Z]+[0-9]+)?)\]/g,function(e,t){return t.replace(/\./g,``)}),e=e.replace(/\$'([^']|'')+'/g,function(e){return e.slice(1)}),e=e.replace(/\$([^\]\. #$]+)/g,function(e,t){return t.match(/^([A-Z]{1,2}|[A-W][A-Z]{2}|X[A-E][A-Z]|XF[A-D])?(10[0-3]\d{4}|104[0-7]\d{3}|1048[0-4]\d{2}|10485[0-6]\d|104857[0-6]|[1-9]\d{0,5})?$/)?e:t}),e=e.replace(/\[.(#[A-Z]*[?!])\]/g,`$1`),e.replace(/[;~]/g,`,`).replace(/\|/g,`;`)}function Md(e){e=e.replace(/\$'([^']|'')+'/g,function(e){return e.slice(1)}),e=e.replace(/\$([^\]\. #$]+)/g,function(e,t){return t.match(/^([A-Z]{1,2}|[A-W][A-Z]{2}|X[A-E][A-Z]|XF[A-D])?(10[0-3]\d{4}|104[0-7]\d{3}|1048[0-4]\d{2}|10485[0-6]\d|104857[0-6]|[1-9]\d{0,5})?$/)?e:t});var t=e.split(`:`);return[t[0].split(`.`)[0],t[0].split(`.`)[1]+(t.length>1?`:`+(t[1].split(`.`)[1]||t[1].split(`.`)[0]):``)]}var Nd={},Pd={};function Fd(e,t){if(e){var n=[.7,.7,.75,.75,.3,.3];t==`xlml`&&(n=[1,1,1,1,.5,.5]),e.left??=n[0],e.right??=n[1],e.top??=n[2],e.bottom??=n[3],e.header??=n[4],e.footer??=n[5]}}function Id(e,t,n,r,i,a,o){try{r.cellNF&&(e.z=G[t])}catch(e){if(r.WTF)throw e}if(!(e.t===`z`&&!r.cellStyles)){if(e.t===`d`&&typeof e.v==`string`&&(e.v=Lt(e.v)),(!r||r.cellText!==!1)&&e.t!==`z`)try{if(G[t]??St(_t[t]||`General`,t),e.t===`e`)e.w=e.w||Xi[e.v];else if(t===0)if(e.t===`n`)(e.v|0)===e.v?e.w=e.v.toString(10):e.w=Fe(e.v);else if(e.t===`d`){var s=jt(e.v,!!o);(s|0)===s?e.w=s.toString(10):e.w=Fe(s)}else if(e.v===void 0)return``;else e.w=Ie(e.v,Pd);else e.t===`d`?e.w=mt(t,jt(e.v,!!o),Pd):e.w=mt(t,e.v,Pd)}catch(e){if(r.WTF)throw e}if(r.cellStyles&&n!=null)try{e.s=a.Fills[n],e.s.fgColor&&e.s.fgColor.theme&&!e.s.fgColor.rgb&&(e.s.fgColor.rgb=Cc(i.themeElements.clrScheme[e.s.fgColor.theme].rgb,e.s.fgColor.tint||0),r.WTF&&(e.s.fgColor.raw_rgb=i.themeElements.clrScheme[e.s.fgColor.theme].rgb)),e.s.bgColor&&e.s.bgColor.theme&&(e.s.bgColor.rgb=Cc(i.themeElements.clrScheme[e.s.bgColor.theme].rgb,e.s.bgColor.tint||0),r.WTF&&(e.s.bgColor.raw_rgb=i.themeElements.clrScheme[e.s.bgColor.theme].rgb))}catch(e){if(r.WTF&&a.Fills)throw e}}}function Ld(e,t){var n=ai(t);n.s.r<=n.e.r&&n.s.c<=n.e.c&&n.s.r>=0&&n.s.c>=0&&(e[`!ref`]=ri(n))}var Rd=/<(?:\w+:)?mergeCell ref=["'][A-Z0-9:]+['"]\s*[\/]?>/g,zd=/<(?:\w+:)?hyperlink [^<>]*>/gm,Bd=/"(\w*:\w*)"/,Vd=/<(?:\w+:)?col\b[^<>]*[\/]?>/g,Hd=/<(?:\w+:)?autoFilter[^>]*/g,Ud=/<(?:\w+:)?pageMargins[^<>]*\/>/g,Wd=/<(?:\w+:)?sheetPr\b[^<>]*?\/>/;function Gd(e,t,n,r,i,a,o){if(!e)return e;r||={"!id":{}},z!=null&&t.dense==null&&(t.dense=z);var s={};t.dense&&(s[`!data`]=[]);var c={s:{r:2e6,c:2e6},e:{r:0,c:0}},l=``,u=``,d=an(e,`sheetData`);d?(l=e.slice(0,d.index),u=e.slice(d.index+d[0].length)):l=u=e;var f=l.match(Wd);f?Kd(f[0],s,i,n):(f=an(l,`sheetPr`))&&qd(f[0],f[1]||``,s,i,n,o,a);var p=(l.match(/<(?:\w*:)?dimension/)||{index:-1}).index;if(p>0){var m=l.slice(p,p+50).match(Bd);m&&!(t&&t.nodim)&&Ld(s,m[1])}var h=an(l,`sheetViews`);h&&h[1]&&$d(h[1],i);var g=[];if(t.cellStyles){var _=l.match(Vd);_&&Xd(g,_)}d&&ef(d[1],s,t,c,a,o,i);var v=u.match(Hd);v&&(s[`!autofilter`]=Zd(v[0]));var y=[],b=u.match(Rd);if(b)for(p=0;p!=b.length;++p)y[p]=ai(b[p].slice(b[p].indexOf(`=`)+2));var x=u.match(zd);x&&Jd(s,x,r);var S=u.match(Ud);S&&(s[`!margins`]=Yd(q(S[0])));var C;if((C=u.match(/legacyDrawing r:id="(.*?)"/))&&(s[`!legrel`]=C[1]),t&&t.nodim&&(c.s.c=c.s.r=0),!s[`!ref`]&&c.e.c>=c.s.c&&c.e.r>=c.s.r&&(s[`!ref`]=ri(c)),t.sheetRows>0&&s[`!ref`]){var w=ai(s[`!ref`]);t.sheetRows<=+w.e.r&&(w.e.r=t.sheetRows-1,w.e.r>c.e.r&&(w.e.r=c.e.r),w.e.r<w.s.r&&(w.s.r=w.e.r),w.e.c>c.e.c&&(w.e.c=c.e.c),w.e.c<w.s.c&&(w.s.c=w.e.c),s[`!fullref`]=s[`!ref`],s[`!ref`]=ri(w))}return g.length>0&&(s[`!cols`]=g),y.length>0&&(s[`!merges`]=y),r[`!id`][s[`!legrel`]]&&(s[`!legdrawel`]=r[`!id`][s[`!legrel`]]),s}function Kd(e,t,n,r){var i=q(e);n.Sheets[r]||(n.Sheets[r]={}),i.codeName&&(n.Sheets[r].CodeName=jn(Vn(i.codeName)))}function qd(e,t,n,r,i){Kd(e.slice(0,e.indexOf(`>`)),n,r,i)}function Jd(e,t,n){for(var r=e[`!data`]!=null,i=0;i!=t.length;++i){var a=q(Vn(t[i]),!0);if(!a.ref)return;var o=((n||{})[`!id`]||[])[a.id];o?(a.Target=o.Target,a.location&&(a.Target+=`#`+jn(a.location))):(a.Target=`#`+jn(a.location),o={Target:a.Target,TargetMode:`Internal`}),a.Rel=o,a.tooltip&&(a.Tooltip=a.tooltip,delete a.tooltip);for(var s=ai(a.ref),c=s.s.r;c<=s.e.r;++c)for(var l=s.s.c;l<=s.e.c;++l){var u=Xr(l)+Kr(c);r?(e[`!data`][c]||(e[`!data`][c]=[]),e[`!data`][c][l]||(e[`!data`][c][l]={t:`z`,v:void 0}),e[`!data`][c][l].l=a):(e[u]||(e[u]={t:`z`,v:void 0}),e[u].l=a)}}}function Yd(e){var t={};return[`left`,`right`,`top`,`bottom`,`header`,`footer`].forEach(function(n){e[n]&&(t[n]=parseFloat(e[n]))}),t}function Xd(e,t){for(var n=!1,r=0;r!=t.length;++r){var i=q(t[r],!0);i.hidden&&=In(i.hidden);var a=parseInt(i.min,10)-1,o=parseInt(i.max,10)-1;for(i.outlineLevel&&(i.level=+i.outlineLevel||0),delete i.min,delete i.max,i.width=+i.width,!n&&i.width&&(n=!0,Mc(i.width)),Nc(i);a<=o;)e[a++]=zt(i)}}function Zd(e){return{ref:(e.match(/ref="([^"]*)"/)||[])[1]}}var Qd=/<(?:\w:)?sheetView(?:[^<>a-z][^<>]*)?\/?>/g;function $d(e,t){t.Views||=[{}],(e.match(Qd)||[]).forEach(function(e,n){var r=q(e);t.Views[n]||(t.Views[n]={}),+r.zoomScale&&(t.Views[n].zoom=+r.zoomScale),r.rightToLeft&&In(r.rightToLeft)&&(t.Views[n].RTL=!0)})}var ef=(function(){var e=/<(?:\w+:)?c[ \/>]/,t=/<\/(?:\w+:)?row>/,n=/r=["']([^"']*)["']/,r=/ref=["']([^"']*)["']/;return function(i,a,o,s,c,l,u){for(var d=0,f=``,p=[],m=[],h=0,g=0,_=0,v=``,y,b,x=0,S=0,C,w,T=0,E=0,D=Array.isArray(l.CellXf),O,k=[],A=[],j=a[`!data`]!=null,M=[],N={},P=!1,ee=!!o.sheetStubs,F=!!((u||{}).WBProps||{}).date1904,I=i.split(t),te=0,ne=I.length;te!=ne;++te){f=I[te].trim();var L=f.length;if(L!==0){var R=0;outa:for(d=0;d<L;++d)switch(f[d]){case`>`:if(f[d-1]!=`/`){++d;break outa}if(o&&o.cellStyles){if(b=q(f.slice(R,d),!0),x=b.r==null?x+1:parseInt(b.r,10),S=-1,o.sheetRows&&o.sheetRows<x)continue;N={},P=!1,b.ht&&(P=!0,N.hpt=parseFloat(b.ht),N.hpx=Ic(N.hpt)),b.hidden&&In(b.hidden)&&(P=!0,N.hidden=!0),b.outlineLevel!=null&&(P=!0,N.level=+b.outlineLevel),P&&(M[x-1]=N)}break;case`<`:R=d;break}if(R>=d)break;if(b=q(f.slice(R,d),!0),x=b.r==null?x+1:parseInt(b.r,10),S=-1,!(o.sheetRows&&o.sheetRows<x)){o.nodim||(s.s.r>x-1&&(s.s.r=x-1),s.e.r<x-1&&(s.e.r=x-1)),o&&o.cellStyles&&(N={},P=!1,b.ht&&(P=!0,N.hpt=parseFloat(b.ht),N.hpx=Ic(N.hpt)),b.hidden&&In(b.hidden)&&(P=!0,N.hidden=!0),b.outlineLevel!=null&&(P=!0,N.level=+b.outlineLevel),P&&(M[x-1]=N)),p=f.slice(d).split(e);for(var z=0;z!=p.length&&p[z].trim().charAt(0)==`<`;++z);for(p=p.slice(z),d=0;d!=p.length;++d)if(f=p[d].trim(),f.length!==0){if(m=f.match(n),h=d,g=0,_=0,f=`<c `+(f.slice(0,1)==`<`?`>`:``)+f,m!=null&&m.length===2){for(h=0,v=m[1],g=0;g!=v.length&&!((_=v.charCodeAt(g)-64)<1||_>26);++g)h=26*h+_;--h,S=h}else++S;for(g=0;g!=f.length&&f.charCodeAt(g)!==62;++g);if(++g,b=q(f.slice(0,g),!0),b.r||=ti({r:x-1,c:S}),v=f.slice(g),y={t:``},(m=an(v,`v`))!=null&&m[1]!==``&&(y.v=jn(m[1])),o.cellFormula){if((m=an(v,`f`))!=null){if(m[1]==``)m[0].indexOf(`t="shared"`)>-1&&(w=q(m[0]),A[w.si]&&(y.f=zl(A[w.si][1],A[w.si][2],b.r)));else if(y.f=jn(Vn(m[1]),!0),o.xlfn||(y.f=Vl(y.f)),m[0].indexOf(`t="array"`)>-1)y.F=(v.match(r)||[])[1],y.F.indexOf(`:`)>-1&&k.push([ai(y.F),y.F]);else if(m[0].indexOf(`t="shared"`)>-1){w=q(m[0]);var B=jn(Vn(m[1]));o.xlfn||(B=Vl(B)),A[parseInt(w.si,10)]=[w,B,b.r]}}else(m=v.match(/<f[^<>]*\/>/))&&(w=q(m[0]),A[w.si]&&(y.f=zl(A[w.si][1],A[w.si][2],b.r)));var V=ei(b.r);for(g=0;g<k.length;++g)V.r>=k[g][0].s.r&&V.r<=k[g][0].e.r&&V.c>=k[g][0].s.c&&V.c<=k[g][0].e.c&&(y.F=k[g][1])}if(b.t==null&&y.v===void 0)if(y.f||y.F)y.v=0,y.t=`n`;else if(ee)y.t=`z`;else continue;else y.t=b.t||`n`;switch(s.s.c>S&&(s.s.c=S),s.e.c<S&&(s.e.c=S),y.t){case`n`:if(y.v==``||y.v==null){if(!ee)continue;y.t=`z`}else y.v=parseFloat(y.v);break;case`s`:if(y.v===void 0){if(!ee)continue;y.t=`z`}else C=Nd[parseInt(y.v,10)],y.v=C.t,y.r=C.r,o.cellHTML&&(y.h=C.h);break;case`str`:y.t=`s`,y.v=y.v==null?``:jn(Vn(y.v),!0),o.cellHTML&&(y.h=Pn(y.v));break;case`inlineStr`:m=an(v,`is`),y.t=`s`,m!=null&&(C=Vs(m[1]))?(y.v=C.t,o.cellHTML&&(y.h=C.h)):y.v=``;break;case`b`:y.v=In(y.v);break;case`d`:o.cellDates?y.v=Lt(y.v,F):(y.v=jt(Lt(y.v,F),F),y.t=`n`);break;case`e`:(!o||o.cellText!==!1)&&(y.w=y.v),y.v=Zi[y.v];break}if(T=E=0,O=null,D&&b.s!==void 0&&(O=l.CellXf[b.s],O!=null&&(O.numFmtId!=null&&(T=O.numFmtId),o.cellStyles&&O.fillId!=null&&(E=O.fillId))),Id(y,T,E,o,c,l,F),o.cellDates&&D&&y.t==`n`&&lt(G[T])&&(y.v=Mt(y.v+(F?1462:0)),y.t=typeof y.v==`number`?`n`:`d`),b.cm&&o.xlmeta){var re=(o.xlmeta.Cell||[])[b.cm-1];re&&re.type==`XLDAPR`&&(y.D=!0)}var H;o.nodim&&(H=ei(b.r),s.s.r>H.r&&(s.s.r=H.r),s.e.r<H.r&&(s.e.r=H.r)),j?(H=ei(b.r),a[`!data`][H.r]||(a[`!data`][H.r]=[]),a[`!data`][H.r][H.c]=y):a[b.r]=y}}}}M.length>0&&(a[`!rows`]=M)}})();function tf(e,t){var n={},r=e.l+t;n.r=e.read_shift(4),e.l+=4;var i=e.read_shift(2);e.l+=1;var a=e.read_shift(1);return e.l=r,a&7&&(n.level=a&7),a&16&&(n.hidden=!0),a&32&&(n.hpt=i/20),n}var nf=Ti;function rf(){}function af(e,t){var n={},r=e[e.l];return++e.l,n.above=!(r&64),n.left=!(r&128),e.l+=18,n.name=yi(e,t-19),n}function of(e){return[_i(e)]}function sf(e){return[vi(e)]}function cf(e){return[_i(e),e.read_shift(1),`b`]}function lf(e){return[vi(e),e.read_shift(1),`b`]}function uf(e){return[_i(e),e.read_shift(1),`e`]}function df(e){return[vi(e),e.read_shift(1),`e`]}function ff(e){return[_i(e),e.read_shift(4),`s`]}function pf(e){return[vi(e),e.read_shift(4),`s`]}function mf(e){return[_i(e),J(e),`n`]}function hf(e){return[vi(e),J(e),`n`]}function gf(e){return[_i(e),Ci(e),`n`]}function _f(e){return[vi(e),Ci(e),`n`]}function vf(e){return[_i(e),hi(e),`is`]}function yf(e){return[_i(e),pi(e),`str`]}function bf(e){return[vi(e),pi(e),`str`]}function xf(e,t,n){var r=e.l+t,i=_i(e);i.r=n[`!row`];var a=[i,e.read_shift(1),`b`];return n.cellFormula?(e.l+=2,a[3]=gd(Td(e,r-e.l,n),null,i,n.supbooks,n)):e.l=r,a}function Sf(e,t,n){var r=e.l+t,i=_i(e);i.r=n[`!row`];var a=[i,e.read_shift(1),`e`];return n.cellFormula?(e.l+=2,a[3]=gd(Td(e,r-e.l,n),null,i,n.supbooks,n)):e.l=r,a}function Cf(e,t,n){var r=e.l+t,i=_i(e);i.r=n[`!row`];var a=[i,J(e),`n`];return n.cellFormula?(e.l+=2,a[3]=gd(Td(e,r-e.l,n),null,i,n.supbooks,n)):e.l=r,a}function wf(e,t,n){var r=e.l+t,i=_i(e);i.r=n[`!row`];var a=[i,pi(e),`str`];return n.cellFormula?(e.l+=2,a[3]=gd(Td(e,r-e.l,n),null,i,n.supbooks,n)):e.l=r,a}var Tf=Ti;function Ef(e,t){var n=e.l+t,r=Ti(e,16),i=bi(e),a=pi(e),o=pi(e),s=pi(e);e.l=n;var c={rfx:r,relId:i,loc:a,display:s};return o&&(c.Tooltip=o),c}function Df(){}function Of(e,t,n){var r=e.l+t,i=wi(e,16),a=e.read_shift(1),o=[i];return o[2]=a,n.cellFormula?o[1]=wd(e,r-e.l,n):e.l=r,o}function kf(e,t,n){var r=e.l+t,i=[Ti(e,16)];return n.cellFormula&&(i[1]=Dd(e,r-e.l,n)),e.l=r,i}var Af=[`left`,`right`,`top`,`bottom`,`header`,`footer`];function jf(e){var t={};return Af.forEach(function(n){t[n]=J(e,8)}),t}function Mf(e){var t=e.read_shift(2);return e.l+=28,{RTL:t&32}}function Nf(){}function Pf(){}function Ff(e,t,n,r,i,a,o){if(!e)return e;var s=t||{};r||={"!id":{}},z!=null&&s.dense==null&&(s.dense=z);var c={};s.dense&&(c[`!data`]=[]);var l,u={s:{r:2e6,c:2e6},e:{r:0,c:0}},d=[],f=!1,p=!1,m,h,g,_,v,y,b,x,S,C=[];s.biff=12,s[`!row`]=0;var w=0,T=!1,E=[],D={},O=s.supbooks||i.supbooks||[[]];if(O.sharedf=D,O.arrayf=E,O.SheetNames=i.SheetNames||i.Sheets.map(function(e){return e.name}),!s.supbooks&&(s.supbooks=O,i.Names))for(var k=0;k<i.Names.length;++k)O[0][k+1]=i.Names[k];var A=[],j=[],M=!1;Lp[16]={n:`BrtShortReal`,f:hf};var N,P,ee=1462*!!((i||{}).WBProps||{}).date1904;if(zr(e,function(e,t,k){if(!p)switch(k){case 148:l=e;break;case 0:m=e,s.sheetRows&&s.sheetRows<=m.r&&(p=!0),x=Kr(_=m.r),s[`!row`]=m.r,(e.hidden||e.hpt||e.level!=null)&&(e.hpt&&(e.hpx=Ic(e.hpt)),j[e.r]=e);break;case 2:case 3:case 4:case 5:case 6:case 7:case 8:case 9:case 10:case 11:case 13:case 14:case 15:case 16:case 17:case 18:case 62:switch(h={t:e[2]},e[2]){case`n`:h.v=e[1];break;case`s`:b=Nd[e[1]],h.v=b.t,h.r=b.r;break;case`b`:h.v=!!e[1];break;case`e`:h.v=e[1],s.cellText!==!1&&(h.w=Xi[h.v]);break;case`str`:h.t=`s`,h.v=e[1];break;case`is`:h.t=`s`,h.v=e[1].t;break}if((g=o.CellXf[e[0].iStyleRef])&&Id(h,g.numFmtId,null,s,a,o,ee>0),v=e[0].c==-1?v+1:e[0].c,s.dense?(c[`!data`][_]||(c[`!data`][_]=[]),c[`!data`][_][v]=h):c[Xr(v)+x]=h,s.cellFormula){for(T=!1,w=0;w<E.length;++w){var F=E[w];m.r>=F[0].s.r&&m.r<=F[0].e.r&&v>=F[0].s.c&&v<=F[0].e.c&&(h.F=ri(F[0]),T=!0)}!T&&e.length>3&&(h.f=e[3])}if(u.s.r>m.r&&(u.s.r=m.r),u.s.c>v&&(u.s.c=v),u.e.r<m.r&&(u.e.r=m.r),u.e.c<v&&(u.e.c=v),s.cellDates&&g&&h.t==`n`&&lt(G[g.numFmtId])){var I=Ae(h.v+ee);I&&(h.t=`d`,h.v=new Date(Date.UTC(I.y,I.m-1,I.d,I.H,I.M,I.S,I.u)))}N&&=(N.type==`XLDAPR`&&(h.D=!0),void 0),P&&=void 0;break;case 1:case 12:if(!s.sheetStubs||f)break;h={t:`z`,v:void 0},v=e[0].c==-1?v+1:e[0].c,s.dense?(c[`!data`][_]||(c[`!data`][_]=[]),c[`!data`][_][v]=h):c[Xr(v)+x]=h,u.s.r>m.r&&(u.s.r=m.r),u.s.c>v&&(u.s.c=v),u.e.r<m.r&&(u.e.r=m.r),u.e.c<v&&(u.e.c=v),N&&=(N.type==`XLDAPR`&&(h.D=!0),void 0),P&&=void 0;break;case 176:C.push(e);break;case 49:N=((s.xlmeta||{}).Cell||[])[e-1];break;case 494:var te=r[`!id`][e.relId];for(te?(e.Target=te.Target,e.loc&&(e.Target+=`#`+e.loc),e.Rel=te):e.relId==``&&(e.Target=`#`+e.loc),_=e.rfx.s.r;_<=e.rfx.e.r;++_)for(v=e.rfx.s.c;v<=e.rfx.e.c;++v)s.dense?(c[`!data`][_]||(c[`!data`][_]=[]),c[`!data`][_][v]||(c[`!data`][_][v]={t:`z`,v:void 0}),c[`!data`][_][v].l=e):(y=Xr(v)+Kr(_),c[y]||(c[y]={t:`z`,v:void 0}),c[y].l=e);break;case 426:if(!s.cellFormula)break;E.push(e),S=s.dense?c[`!data`][_][v]:c[Xr(v)+x],S.f=gd(e[1],u,{r:m.r,c:v},O,s),S.F=ri(e[0]);break;case 427:if(!s.cellFormula)break;D[ti(e[0].s)]=e[1],S=s.dense?c[`!data`][_][v]:c[Xr(v)+x],S.f=gd(e[1],u,{r:m.r,c:v},O,s);break;case 60:if(!s.cellStyles)break;for(;e.e>=e.s;)A[e.e--]={width:e.w/256,hidden:!!(e.flags&1),level:e.level},M||(M=!0,Mc(e.w/256)),Nc(A[e.e+1]);break;case 551:e&&(c[`!legrel`]=e);break;case 161:c[`!autofilter`]={ref:ri(e)};break;case 476:c[`!margins`]=e;break;case 147:i.Sheets[n]||(i.Sheets[n]={}),e.name&&(i.Sheets[n].CodeName=e.name),(e.above||e.left)&&(c[`!outline`]={above:e.above,left:e.left});break;case 137:i.Views||=[{}],i.Views[0]||(i.Views[0]={}),e.RTL&&(i.Views[0].RTL=!0);break;case 485:break;case 64:case 1053:break;case 151:break;case 152:case 175:case 644:case 625:case 562:case 396:case 1112:case 1146:case 471:case 1050:case 649:case 1105:case 589:case 607:case 564:case 1055:case 168:case 174:case 1180:case 499:case 507:case 550:case 171:case 167:case 1177:case 169:case 1181:case 552:case 661:case 639:case 478:case 537:case 477:case 536:case 1103:case 680:case 1104:case 1024:case 663:case 535:case 678:case 504:case 1043:case 428:case 170:case 3072:case 50:case 2070:case 1045:break;case 35:f=!0;break;case 36:f=!1;break;case 37:d.push(k),f=!0;break;case 38:d.pop(),f=!1;break;default:if(!t.T&&(!f||s.WTF))throw Error(`Unexpected record 0x`+k.toString(16))}},s),delete s.supbooks,delete s[`!row`],!c[`!ref`]&&(u.s.r<2e6||l&&(l.e.r>0||l.e.c>0||l.s.r>0||l.s.c>0))&&(c[`!ref`]=ri(l||u)),s.sheetRows&&c[`!ref`]){var F=ai(c[`!ref`]);s.sheetRows<=+F.e.r&&(F.e.r=s.sheetRows-1,F.e.r>u.e.r&&(F.e.r=u.e.r),F.e.r<F.s.r&&(F.s.r=F.e.r),F.e.c>u.e.c&&(F.e.c=u.e.c),F.e.c<F.s.c&&(F.s.c=F.e.c),c[`!fullref`]=c[`!ref`],c[`!ref`]=ri(F))}return C.length>0&&(c[`!merges`]=C),A.length>0&&(c[`!cols`]=A),j.length>0&&(c[`!rows`]=j),r[`!id`][c[`!legrel`]]&&(c[`!legdrawel`]=r[`!id`][c[`!legrel`]]),c}function If(e){var t=[],n=e.match(/^<c:numCache>/),r;(e.match(/<c:pt idx="(\d*)"[^<>\/]*><c:v>([^<])<\/c:v><\/c:pt>/gm)||[]).forEach(function(e){var r=e.match(/<c:pt idx="(\d*)"[^<>\/]*><c:v>([^<]*)<\/c:v><\/c:pt>/);r&&(t[+r[1]]=n?+r[2]:r[2])});var i=jn((rn(e,`c:formatCode`)||[``,`General`])[1]);return(en(e,`<c:f>`,`</c:f>`)||[]).forEach(function(e){r=e.replace(/<[^<>]*>/g,``)}),[t,i,r]}function Lf(e,t,n,r,i,a){var o=a||{"!type":`chart`};if(!e)return a;var s=0,c=0,l=`A`,u={s:{r:2e6,c:2e6},e:{r:0,c:0}};return(en(e,`<c:numCache>`,`</c:numCache>`)||[]).forEach(function(e){var t=If(e);u.s.r=u.s.c=0,u.e.c=s,l=Xr(s),t[0].forEach(function(e,n){o[`!data`]?(o[`!data`][n]||(o[`!data`][n]=[]),o[`!data`][n][s]={t:`n`,v:e,z:t[1]}):o[l+Kr(n)]={t:`n`,v:e,z:t[1]},c=n}),u.e.r<c&&(u.e.r=c),++s}),s>0&&(o[`!ref`]=ri(u)),o}function Rf(e,t,n,r,i){if(!e)return e;r||={"!id":{}};var a={"!type":`chart`,"!drawel":null,"!rel":``},o,s=e.match(Wd);return s&&Kd(s[0],a,i,n),(o=e.match(/drawing r:id="(.*?)"/))&&(a[`!rel`]=o[1]),r[`!id`][a[`!rel`]]&&(a[`!drawel`]=r[`!id`][a[`!rel`]]),a}function zf(e,t){return e.l+=10,{name:pi(e,t-10)}}function Bf(e,t,n,r,i){if(!e)return e;r||={"!id":{}};var a={"!type":`chart`,"!drawel":null,"!rel":``},o=[],s=!1;return zr(e,function(e,r,c){switch(c){case 550:a[`!rel`]=e;break;case 651:i.Sheets[n]||(i.Sheets[n]={}),e.name&&(i.Sheets[n].CodeName=e.name);break;case 562:case 652:case 669:case 679:case 551:case 552:case 476:case 3072:break;case 35:s=!0;break;case 36:s=!1;break;case 37:o.push(c);break;case 38:o.pop();break;default:if(r.T>0)o.push(c);else if(r.T<0)o.pop();else if(!s||t.WTF)throw Error(`Unexpected record 0x`+c.toString(16))}},t),r[`!id`][a[`!rel`]]&&(a[`!drawel`]=r[`!id`][a[`!rel`]]),a}var Vf=[[`allowRefreshQuery`,!1,`bool`],[`autoCompressPictures`,!0,`bool`],[`backupFile`,!1,`bool`],[`checkCompatibility`,!1,`bool`],[`CodeName`,``],[`date1904`,!1,`bool`],[`defaultThemeVersion`,0,`int`],[`filterPrivacy`,!1,`bool`],[`hidePivotFieldList`,!1,`bool`],[`promptedSolutions`,!1,`bool`],[`publishItems`,!1,`bool`],[`refreshAllConnections`,!1,`bool`],[`saveExternalLinkValues`,!0,`bool`],[`showBorderUnselectedTables`,!0,`bool`],[`showInkAnnotation`,!0,`bool`],[`showObjects`,`all`],[`showPivotChartFilter`,!1,`bool`],[`updateLinks`,`userSet`]],Hf=[[`activeTab`,0,`int`],[`autoFilterDateGrouping`,!0,`bool`],[`firstSheet`,0,`int`],[`minimized`,!1,`bool`],[`showHorizontalScroll`,!0,`bool`],[`showSheetTabs`,!0,`bool`],[`showVerticalScroll`,!0,`bool`],[`tabRatio`,600,`int`],[`visibility`,`visible`]],Uf=[],Wf=[[`calcCompleted`,`true`],[`calcMode`,`auto`],[`calcOnSave`,`true`],[`concurrentCalc`,`true`],[`fullCalcOnLoad`,`false`],[`fullPrecision`,`true`],[`iterate`,`false`],[`iterateCount`,`100`],[`iterateDelta`,`0.001`],[`refMode`,`A1`]];function Gf(e,t){for(var n=0;n!=e.length;++n)for(var r=e[n],i=0;i!=t.length;++i){var a=t[i];if(r[a[0]]==null)r[a[0]]=a[1];else switch(a[2]){case`bool`:typeof r[a[0]]==`string`&&(r[a[0]]=In(r[a[0]]));break;case`int`:typeof r[a[0]]==`string`&&(r[a[0]]=parseInt(r[a[0]],10));break}}}function Kf(e,t){for(var n=0;n!=t.length;++n){var r=t[n];if(e[r[0]]==null)e[r[0]]=r[1];else switch(r[2]){case`bool`:typeof e[r[0]]==`string`&&(e[r[0]]=In(e[r[0]]));break;case`int`:typeof e[r[0]]==`string`&&(e[r[0]]=parseInt(e[r[0]],10));break}}}function qf(e){Kf(e.WBProps,Vf),Kf(e.CalcPr,Wf),Gf(e.WBView,Hf),Gf(e.Sheets,Uf),Pd.date1904=In(e.WBProps.date1904)}var Jf=`:][*?/\\`.split(``);function Yf(e,t){try{if(e==``)throw Error(`Sheet name cannot be blank`);if(e.length>31)throw Error(`Sheet name cannot exceed 31 chars`);if(e.charCodeAt(0)==39||e.charCodeAt(e.length-1)==39)throw Error(`Sheet name cannot start or end with apostrophe (')`);if(e.toLowerCase()==`history`)throw Error(`Sheet name cannot be 'History'`);Jf.forEach(function(t){if(e.indexOf(t)!=-1)throw Error(`Sheet name cannot contain : \\ / ? * [ ]`)})}catch(e){if(t)return!1;throw e}return!0}var Xf=/<\w+:workbook/;function Zf(e,t){if(!e)throw Error(`Could not find file`);var n={AppVersion:{},WBProps:{},WBView:[],Sheets:[],CalcPr:{},Names:[],xmlns:``},r=!1,i=`xmlns`,a={},o=0;if(e.replace(wn,function(s,c){var l=q(s);switch(On(l[0])){case`<?xml`:break;case`<workbook`:s.match(Xf)&&(i=`xmlns`+s.match(/<(\w+):/)[1]),n.xmlns=l[i];break;case`</workbook>`:break;case`<fileVersion`:delete l[0],n.AppVersion=l;break;case`<fileVersion/>`:case`</fileVersion>`:break;case`<fileSharing`:break;case`<fileSharing/>`:break;case`<workbookPr`:case`<workbookPr/>`:Vf.forEach(function(e){if(l[e[0]]!=null)switch(e[2]){case`bool`:n.WBProps[e[0]]=In(l[e[0]]);break;case`int`:n.WBProps[e[0]]=parseInt(l[e[0]],10);break;default:n.WBProps[e[0]]=l[e[0]]}}),l.codeName&&(n.WBProps.CodeName=Vn(l.codeName));break;case`</workbookPr>`:break;case`<workbookProtection`:break;case`<workbookProtection/>`:break;case`<bookViews`:case`<bookViews>`:case`</bookViews>`:break;case`<workbookView`:case`<workbookView/>`:delete l[0],n.WBView.push(l);break;case`</workbookView>`:break;case`<sheets`:case`<sheets>`:case`</sheets>`:break;case`<sheet`:switch(l.state){case`hidden`:l.Hidden=1;break;case`veryHidden`:l.Hidden=2;break;default:l.Hidden=0}delete l.state,l.name=jn(Vn(l.name)),delete l[0],n.Sheets.push(l);break;case`</sheet>`:break;case`<functionGroups`:case`<functionGroups/>`:break;case`<functionGroup`:break;case`<externalReferences`:case`</externalReferences>`:case`<externalReferences>`:break;case`<externalReference`:break;case`<definedNames/>`:break;case`<definedNames>`:case`<definedNames`:r=!0;break;case`</definedNames>`:r=!1;break;case`<definedName`:a={},a.Name=Vn(l.name),l.comment&&(a.Comment=l.comment),l.localSheetId&&(a.Sheet=+l.localSheetId),In(l.hidden||`0`)&&(a.Hidden=!0),o=c+s.length;break;case`</definedName>`:a.Ref=jn(Vn(e.slice(o,c))),n.Names.push(a);break;case`<definedName/>`:break;case`<calcPr`:delete l[0],n.CalcPr=l;break;case`<calcPr/>`:delete l[0],n.CalcPr=l;break;case`</calcPr>`:break;case`<oleSize`:break;case`<customWorkbookViews>`:case`</customWorkbookViews>`:case`<customWorkbookViews`:break;case`<customWorkbookView`:case`</customWorkbookView>`:break;case`<pivotCaches>`:case`</pivotCaches>`:case`<pivotCaches`:break;case`<pivotCache`:break;case`<smartTagPr`:case`<smartTagPr/>`:break;case`<smartTagTypes`:case`<smartTagTypes>`:case`</smartTagTypes>`:break;case`<smartTagType`:break;case`<webPublishing`:case`<webPublishing/>`:break;case`<fileRecoveryPr`:case`<fileRecoveryPr/>`:break;case`<webPublishObjects>`:case`<webPublishObjects`:case`</webPublishObjects>`:break;case`<webPublishObject`:break;case`<extLst`:case`<extLst>`:case`</extLst>`:case`<extLst/>`:break;case`<ext`:r=!0;break;case`</ext>`:r=!1;break;case`<ArchID`:break;case`<AlternateContent`:case`<AlternateContent>`:r=!0;break;case`</AlternateContent>`:r=!1;break;case`<revisionPtr`:break;default:if(!r&&t.WTF)throw Error(`unrecognized `+l[0]+` in workbook`)}return s}),$n.indexOf(n.xmlns)===-1)throw Error(`Unknown Namespace: `+n.xmlns);return qf(n),n}function Qf(e,t){var n={};return n.Hidden=e.read_shift(4),n.iTabID=e.read_shift(4),n.strRelID=Si(e,t-8),n.name=pi(e),n}function $f(e,t){var n={},r=e.read_shift(4);n.defaultThemeVersion=e.read_shift(4);var i=t>8?pi(e):``;return i.length>0&&(n.CodeName=i),n.autoCompressPictures=!!(r&65536),n.backupFile=!!(r&64),n.checkCompatibility=!!(r&4096),n.date1904=!!(r&1),n.filterPrivacy=!!(r&8),n.hidePivotFieldList=!!(r&1024),n.promptedSolutions=!!(r&16),n.publishItems=!!(r&2048),n.refreshAllConnections=!!(r&262144),n.saveExternalLinkValues=!!(r&128),n.showBorderUnselectedTables=!!(r&4),n.showInkAnnotation=!!(r&32),n.showObjects=[`all`,`placeholders`,`none`][r>>13&3],n.showPivotChartFilter=!!(r&32768),n.updateLinks=[`userSet`,`never`,`always`][r>>8&3],n}function ep(e,t){var n={};return e.read_shift(4),n.ArchID=e.read_shift(4),e.l+=t-8,n}function tp(e,t,n){var r=e.l+t,i=e.read_shift(4);e.l+=1;var a=e.read_shift(4),o=xi(e),s,c=``;try{s=Ed(e,0,n);try{c=bi(e)}catch{}}catch{console.error(`Could not parse defined name `+o)}i&32&&(o=`_xlnm.`+o),e.l=r;var l={Name:o,Ptg:s,Flags:i};return a<268435455&&(l.Sheet=a),c&&(l.Comment=c),l}function np(e,t){var n={AppVersion:{},WBProps:{},WBView:[],Sheets:[],CalcPr:{},xmlns:``},r=[],i=!1;t||={},t.biff=12;var a=[],o=[[]];return o.SheetNames=[],o.XTI=[],Lp[16]={n:`BrtFRTArchID$`,f:ep},zr(e,function(e,s,c){switch(c){case 156:o.SheetNames.push(e.name),n.Sheets.push(e);break;case 153:n.WBProps=e;break;case 39:e.Sheet!=null&&(t.SID=e.Sheet),e.Ref=e.Ptg?gd(e.Ptg,null,null,o,t):`#REF!`,delete t.SID,delete e.Ptg,a.push(e);break;case 1036:break;case 357:case 358:case 355:case 667:o[0].length?o.push([c,e]):o[0]=[c,e],o[o.length-1].XTI=[];break;case 362:o.length===0&&(o[0]=[],o[0].XTI=[]),o[o.length-1].XTI=o[o.length-1].XTI.concat(e),o.XTI=o.XTI.concat(e);break;case 361:break;case 2071:case 158:case 143:case 664:case 353:break;case 3072:case 3073:case 534:case 677:case 157:case 610:case 2050:case 155:case 548:case 676:case 128:case 665:case 2128:case 2125:case 549:case 2053:case 596:case 2076:case 2075:case 2082:case 397:case 154:case 1117:case 553:case 2091:break;case 35:r.push(c),i=!0;break;case 36:r.pop(),i=!1;break;case 37:r.push(c),i=!0;break;case 38:r.pop(),i=!1;break;case 16:break;default:if(!s.T&&(!i||t.WTF&&r[r.length-1]!=37&&r[r.length-1]!=35))throw Error(`Unexpected record 0x`+c.toString(16))}},t),qf(n),n.Names=a,n.supbooks=o,n}function rp(e,t,n){return t.slice(-4)===`.bin`?np(e,n):Zf(e,n)}function ip(e,t,n,r,i,a,o,s){return t.slice(-4)===`.bin`?Ff(e,r,n,i,a,o,s):Gd(e,r,n,i,a,o,s)}function ap(e,t,n,r,i,a,o,s){return t.slice(-4)===`.bin`?Bf(e,r,n,i,a,o,s):Rf(e,r,n,i,a,o,s)}function op(e,t,n,r,i,a,o,s){return t.slice(-4)===`.bin`?Nl(e,r,n,i,a,o,s):Pl(e,r,n,i,a,o,s)}function sp(e,t,n,r,i,a,o,s){return t.slice(-4)===`.bin`?jl(e,r,n,i,a,o,s):Ml(e,r,n,i,a,o,s)}function cp(e,t,n,r){return t.slice(-4)===`.bin`?Zc(e,n,r):Gc(e,n,r)}function lp(e,t,n){return t.slice(-4)===`.bin`?Ks(e,n):Ws(e,n)}function up(e,t,n){return t.slice(-4)===`.bin`?Ol(e,n):Cl(e,n)}function dp(e,t,n){return t.slice(-4)===`.bin`?vl(e,t,n):gl(e,t,n)}function fp(e,t,n,r){if(n.slice(-4)===`.bin`)return yl(e,t,n,r)}function pp(e,t,n){return t.slice(-4)===`.bin`?ml(e,t,n):hl(e,t,n)}var mp=/\b((?:\w+:)?[\w]+)=((?:")([^"]*)(?:")|(?:')([^']*)(?:'))/g,hp=/\b((?:\w+:)?[\w]+)=((?:")(?:[^"]*)(?:")|(?:')(?:[^']*)(?:'))/;function gp(e,t){var n=e.split(/\s+/),r=[];if(t||(r[0]=n[0]),n.length===1)return r;var i=e.match(mp),a,o,s,c;if(i)for(c=0;c!=i.length;++c)a=i[c].match(hp),(o=a[1].indexOf(`:`))===-1?r[a[1]]=a[2].slice(1,a[2].length-1):(s=a[1].slice(0,6)===`xmlns:`?`xmlns`+a[1].slice(6):a[1].slice(o+1),r[s]=a[2].slice(1,a[2].length-1));return r}function _p(e){var t=e.split(/\s+/),n={};if(t.length===1)return n;var r=e.match(mp),i,a,o,s;if(r)for(s=0;s!=r.length;++s)i=r[s].match(hp),(a=i[1].indexOf(`:`))===-1?n[i[1]]=i[2].slice(1,i[2].length-1):(o=i[1].slice(0,6)===`xmlns:`?`xmlns`+i[1].slice(6):i[1].slice(a+1),n[o]=i[2].slice(1,i[2].length-1));return n}var vp;function yp(e,t,n){var r=vp[e]||jn(e);return r===`General`?Ie(t):mt(r,t,{date1904:!!n})}function bp(e,t,n,r){var i=r;switch((n[0].match(/dt:dt="([\w.]+)"/)||[``,``])[1]){case`boolean`:i=In(r);break;case`i2`:case`int`:i=parseInt(r,10);break;case`r4`:case`float`:i=parseFloat(r);break;case`date`:case`dateTime.tz`:i=Lt(r);break;case`i8`:case`string`:case`fixed`:case`uuid`:case`bin.base64`:break;default:throw Error(`bad custprop:`+n[0])}e[jn(t)]=i}function xp(e,t,n,r){if(e.t!==`z`){if(!n||n.cellText!==!1)try{e.t===`e`?e.w=e.w||Xi[e.v]:t===`General`?e.t===`n`?(e.v|0)===e.v?e.w=e.v.toString(10):e.w=Fe(e.v):e.w=Ie(e.v):e.w=yp(t||`General`,e.v,r)}catch(e){if(n.WTF)throw e}try{var i=vp[t]||t||`General`;if(n.cellNF&&(e.z=i),n.cellDates&&e.t==`n`&&lt(i)){var a=Ae(e.v+(r?1462:0));a&&(e.t=`d`,e.v=new Date(Date.UTC(a.y,a.m-1,a.d,a.H,a.M,a.S,a.u)))}}catch(e){if(n.WTF)throw e}}}function Sp(e,t,n){if(n.cellStyles&&t.Interior){var r=t.Interior;r.Pattern&&(r.patternType=Lc[r.Pattern]||r.Pattern)}e[t.ID]=t}function Cp(e,t,n,r,i,a,o,s,c,l,u){var d=`General`,f=r.StyleID,p={};l||={};var m=[],h=0;for(f===void 0&&s&&(f=s.StyleID),f===void 0&&o&&(f=o.StyleID);a[f]!==void 0;){var g=a[f];if(g.nf&&(d=g.nf),g.Interior&&m.push(g.Interior),!g.Parent)break;f=g.Parent}switch(n.Type){case`Boolean`:r.t=`b`,r.v=In(e);break;case`String`:r.t=`s`,r.r=Fn(jn(e)),r.v=e.indexOf(`<`)>-1?jn(t||e).replace(/<[^<>]*>/g,``):r.r;break;case`DateTime`:e.slice(-1)!=`Z`&&(e+=`Z`),r.v=jt(Lt(e,u),u),r.v!==r.v&&(r.v=jn(e)),(!d||d==`General`)&&(d=`yyyy-mm-dd`);case`Number`:r.v===void 0&&(r.v=+e),r.t||=`n`;break;case`Error`:r.t=`e`,r.v=Zi[e],l.cellText!==!1&&(r.w=e);break;default:e==``&&t==``?r.t=`z`:(r.t=`s`,r.v=Fn(t||e));break}if(xp(r,d,l,u),l.cellFormula!==!1)if(r.Formula){var _=jn(r.Formula);_.charCodeAt(0)==61&&(_=_.slice(1)),r.f=Fl(_,i),delete r.Formula,r.ArrayRange==`RC`?r.F=Fl(`RC:RC`,i):r.ArrayRange&&(r.F=Fl(r.ArrayRange,i),c.push([ai(r.F),r.F]))}else for(h=0;h<c.length;++h)i.r>=c[h][0].s.r&&i.r<=c[h][0].e.r&&i.c>=c[h][0].s.c&&i.c<=c[h][0].e.c&&(r.F=c[h][1]);l.cellStyles&&(m.forEach(function(e){!p.patternType&&e.patternType&&(p.patternType=e.patternType)}),r.s=p),r.StyleID!==void 0&&(r.ixfe=r.StyleID)}function wp(e){return Qi.indexOf(`_xlnm.`+e)>-1?`_xlnm.`+e:e}function Tp(e){e.t=e.v||``,e.t=e.t.replace(/\r\n/g,`
`).replace(/\r/g,`
`),e.v=e.w=e.ixfe=void 0}function Ep(e,t){var n=t||{};gt();var r=ne(Xn(e));(n.type==`binary`||n.type==`array`||n.type==`base64`)&&(r=O===void 0?Vn(r):O.utils.decode(65001,ee(r)));var i=r.slice(0,1024).toLowerCase(),a=!1;if(i=i.replace(/".*?"/g,``),(i.indexOf(`>`)&1023)>Math.min(i.indexOf(`,`)&1023,i.indexOf(`;`)&1023)){var o=zt(n);return o.type=`string`,Ns.to_workbook(r,o)}if(i.indexOf(`<?xml`)==-1&&[`html`,`table`,`head`,`meta`,`script`,`style`,`div`].forEach(function(e){i.indexOf(`<`+e)>=0&&(a=!0)}),a)return Wp(r,n);vp={"General Number":`General`,"General Date":G[22],"Long Date":`dddd, mmmm dd, yyyy`,"Medium Date":G[15],"Short Date":G[14],"Long Time":G[19],"Medium Time":G[18],"Short Time":G[20],Currency:`"$"#,##0.00_);[Red]\\("$"#,##0.00\\)`,Fixed:G[2],Standard:G[4],Percent:G[10],Scientific:G[11],"Yes/No":`"Yes";"Yes";"No";@`,"True/False":`"True";"True";"False";@`,"On/Off":`"Yes";"Yes";"No";@`};var s,c=[],l;z!=null&&n.dense==null&&(n.dense=z);var u={},d=[],f={},p=``;n.dense&&(f[`!data`]=[]);var m={},h={},g=gp(`<Data ss:Type="String">`),_=0,v=0,y=0,b={s:{r:2e6,c:2e6},e:{r:0,c:0}},x={},S={},C=``,w=0,T=[],E={},D={},k=0,A=[],j=[],M={},N=[],P,F=!1,I=[],te=[],L={},R=0,B=0,V={Sheets:[],WBProps:{date1904:!1}},re={};Zn.lastIndex=0,r=tn(r,`<!--`,`-->`);for(var H=``;s=Zn.exec(r);)switch(s[3]=(H=s[3]).toLowerCase()){case`data`:if(H==`data`){if(s[1]===`/`){if((l=c.pop())[0]!==s[3])throw Error(`Bad state: `+l.join(`|`))}else s[0].charAt(s[0].length-2)!==`/`&&c.push([s[3],!0]);break}if(c[c.length-1][1])break;s[1]===`/`?Cp(r.slice(_,s.index),C,g,c[c.length-1][0]==`comment`?M:m,{c:v,r:y},x,N[v],h,I,n,V.WBProps.date1904):(C=``,g=gp(s[0]),_=s.index+s[0].length);break;case`cell`:if(s[1]===`/`)if(j.length>0&&(m.c=j),(!n.sheetRows||n.sheetRows>y)&&m.v!==void 0&&(n.dense?(f[`!data`][y]||(f[`!data`][y]=[]),f[`!data`][y][v]=m):f[Xr(v)+Kr(y)]=m),m.HRef&&(m.l={Target:jn(m.HRef)},m.HRefScreenTip&&(m.l.Tooltip=m.HRefScreenTip),delete m.HRef,delete m.HRefScreenTip),(m.MergeAcross||m.MergeDown)&&(R=v+(parseInt(m.MergeAcross,10)|0),B=y+(parseInt(m.MergeDown,10)|0),(R>v||B>y)&&T.push({s:{c:v,r:y},e:{c:R,r:B}})),!n.sheetStubs)m.MergeAcross?v=R+1:++v;else if(m.MergeAcross||m.MergeDown){for(var U=v;U<=R;++U)for(var ie=y;ie<=B;++ie)(U>v||ie>y)&&(n.dense?(f[`!data`][ie]||(f[`!data`][ie]=[]),f[`!data`][ie][U]={t:`z`}):f[Xr(U)+Kr(ie)]={t:`z`});v=R+1}else++v;else m=_p(s[0]),m.Index&&(v=m.Index-1),v<b.s.c&&(b.s.c=v),v>b.e.c&&(b.e.c=v),s[0].slice(-2)===`/>`&&++v,j=[];break;case`row`:s[1]===`/`||s[0].slice(-2)===`/>`?(y<b.s.r&&(b.s.r=y),y>b.e.r&&(b.e.r=y),s[0].slice(-2)===`/>`&&(h=gp(s[0]),h.Index&&(y=h.Index-1)),v=0,++y):(h=gp(s[0]),h.Index&&(y=h.Index-1),L={},(h.AutoFitHeight==`0`||h.Height)&&(L.hpx=parseInt(h.Height,10),L.hpt=Fc(L.hpx),te[y]=L),h.Hidden==`1`&&(L.hidden=!0,te[y]=L));break;case`worksheet`:if(s[1]===`/`){if((l=c.pop())[0]!==s[3])throw Error(`Bad state: `+l.join(`|`));d.push(p),b.s.r<=b.e.r&&b.s.c<=b.e.c&&(f[`!ref`]=ri(b),n.sheetRows&&n.sheetRows<=b.e.r&&(f[`!fullref`]=f[`!ref`],b.e.r=n.sheetRows-1,f[`!ref`]=ri(b))),T.length&&(f[`!merges`]=T),N.length>0&&(f[`!cols`]=N),te.length>0&&(f[`!rows`]=te),u[p]=f}else b={s:{r:2e6,c:2e6},e:{r:0,c:0}},y=v=0,c.push([s[3],!1]),l=gp(s[0]),p=jn(l.Name),f={},n.dense&&(f[`!data`]=[]),T=[],I=[],te=[],re={name:p,Hidden:0},V.Sheets.push(re);break;case`table`:if(s[1]===`/`){if((l=c.pop())[0]!==s[3])throw Error(`Bad state: `+l.join(`|`))}else if(s[0].slice(-2)==`/>`)break;else c.push([s[3],!1]),N=[],F=!1;break;case`style`:s[1]===`/`?Sp(x,S,n):S=gp(s[0]);break;case`numberformat`:S.nf=jn(gp(s[0]).Format||`General`),vp[S.nf]&&(S.nf=vp[S.nf]);for(var ae=0;ae!=392&&G[ae]!=S.nf;++ae);if(ae==392){for(ae=57;ae!=392;++ae)if(G[ae]==null){St(S.nf,ae);break}}break;case`column`:if(c[c.length-1][0]!==`table`||s[1]===`/`)break;if(P=gp(s[0]),P.Hidden&&(P.hidden=!0,delete P.Hidden),P.Width&&(P.wpx=parseInt(P.Width,10)),!F&&P.wpx>10){F=!0,Dc=wc;for(var oe=0;oe<N.length;++oe)N[oe]&&Nc(N[oe])}F&&Nc(P),N[P.Index-1||N.length]=P;for(var W=0;W<+P.Span;++W)N[N.length]=zt(P);break;case`namedrange`:if(s[1]===`/`)break;V.Names||=[];var se=q(s[0]),ce={Name:wp(se.Name),Ref:Fl(se.RefersTo.slice(1),{r:0,c:0})};V.Sheets.length>0&&(ce.Sheet=V.Sheets.length-1),V.Names.push(ce);break;case`namedcell`:break;case`b`:break;case`i`:break;case`u`:break;case`s`:break;case`em`:break;case`h2`:break;case`h3`:break;case`sub`:break;case`sup`:break;case`span`:break;case`alignment`:break;case`borders`:break;case`border`:break;case`font`:if(s[0].slice(-2)===`/>`)break;s[1]===`/`?C+=r.slice(w,s.index):w=s.index+s[0].length;break;case`interior`:if(!n.cellStyles)break;S.Interior=gp(s[0]);break;case`protection`:break;case`author`:case`title`:case`description`:case`created`:case`keywords`:case`subject`:case`category`:case`company`:case`lastauthor`:case`lastsaved`:case`lastprinted`:case`version`:case`revision`:case`totaltime`:case`hyperlinkbase`:case`manager`:case`contentstatus`:case`identifier`:case`language`:case`appname`:if(s[0].slice(-2)===`/>`)break;s[1]===`/`?ga(E,H,r.slice(k,s.index)):k=s.index+s[0].length;break;case`paragraphs`:break;case`styles`:case`workbook`:if(s[1]===`/`){if((l=c.pop())[0]!==s[3])throw Error(`Bad state: `+l.join(`|`))}else c.push([s[3],!1]);break;case`comment`:if(s[1]===`/`){if((l=c.pop())[0]!==s[3])throw Error(`Bad state: `+l.join(`|`));Tp(M),j.push(M)}else c.push([s[3],!1]),l=gp(s[0]),In(l.ShowAlways||`0`)||(j.hidden=!0),M={a:l.Author};break;case`autofilter`:if(s[1]===`/`){if((l=c.pop())[0]!==s[3])throw Error(`Bad state: `+l.join(`|`))}else if(s[0].charAt(s[0].length-2)!==`/`){var le=gp(s[0]);f[`!autofilter`]={ref:Fl(le.Range).replace(/\$/g,``)},c.push([s[3],!0])}break;case`name`:break;case`datavalidation`:if(s[1]===`/`){if((l=c.pop())[0]!==s[3])throw Error(`Bad state: `+l.join(`|`))}else s[0].charAt(s[0].length-2)!==`/`&&c.push([s[3],!0]);break;case`pixelsperinch`:break;case`componentoptions`:case`documentproperties`:case`customdocumentproperties`:case`officedocumentsettings`:case`pivottable`:case`pivotcache`:case`names`:case`mapinfo`:case`pagebreaks`:case`querytable`:case`sorting`:case`schema`:case`conditionalformatting`:case`smarttagtype`:case`smarttags`:case`excelworkbook`:case`workbookoptions`:case`worksheetoptions`:if(s[1]===`/`){if((l=c.pop())[0]!==s[3])throw Error(`Bad state: `+l.join(`|`))}else s[0].charAt(s[0].length-2)!==`/`&&c.push([s[3],!0]);break;case`null`:break;default:if(c.length==0&&s[3]==`document`||c.length==0&&s[3]==`uof`)return nm(r,n);var ue=!0;switch(c[c.length-1][0]){case`officedocumentsettings`:switch(s[3]){case`allowpng`:break;case`removepersonalinformation`:break;case`downloadcomponents`:break;case`locationofcomponents`:break;case`colors`:break;case`color`:break;case`index`:break;case`rgb`:break;case`targetscreensize`:break;case`readonlyrecommended`:break;default:ue=!1}break;case`componentoptions`:switch(s[3]){case`toolbar`:break;case`hideofficelogo`:break;case`spreadsheetautofit`:break;case`label`:break;case`caption`:break;case`maxheight`:break;case`maxwidth`:break;case`nextsheetnumber`:break;default:ue=!1}break;case`excelworkbook`:switch(s[3]){case`date1904`:V.WBProps.date1904=!0;break;case`hidehorizontalscrollbar`:break;case`hideverticalscrollbar`:break;case`hideworkbooktabs`:break;case`windowheight`:break;case`windowwidth`:break;case`windowtopx`:break;case`windowtopy`:break;case`tabratio`:break;case`protectstructure`:break;case`protectwindow`:break;case`protectwindows`:break;case`activesheet`:break;case`displayinknotes`:break;case`firstvisiblesheet`:break;case`supbook`:break;case`sheetname`:break;case`sheetindex`:break;case`sheetindexfirst`:break;case`sheetindexlast`:break;case`dll`:break;case`acceptlabelsinformulas`:break;case`donotsavelinkvalues`:break;case`iteration`:break;case`maxiterations`:break;case`maxchange`:break;case`path`:break;case`xct`:break;case`count`:break;case`selectedsheets`:break;case`calculation`:break;case`uncalced`:break;case`startupprompt`:break;case`crn`:break;case`externname`:break;case`formula`:break;case`colfirst`:break;case`collast`:break;case`wantadvise`:break;case`boolean`:break;case`error`:break;case`text`:break;case`ole`:break;case`noautorecover`:break;case`publishobjects`:break;case`donotcalculatebeforesave`:break;case`number`:break;case`refmoder1c1`:break;case`embedsavesmarttags`:break;default:ue=!1}break;case`workbookoptions`:switch(s[3]){case`owcversion`:break;case`height`:break;case`width`:break;default:ue=!1}break;case`worksheetoptions`:switch(s[3]){case`visible`:if(s[0].slice(-2)!==`/>`)if(s[1]===`/`)switch(r.slice(k,s.index)){case`SheetHidden`:re.Hidden=1;break;case`SheetVeryHidden`:re.Hidden=2;break}else k=s.index+s[0].length;break;case`header`:f[`!margins`]||Fd(f[`!margins`]={},`xlml`),isNaN(+q(s[0]).Margin)||(f[`!margins`].header=+q(s[0]).Margin);break;case`footer`:f[`!margins`]||Fd(f[`!margins`]={},`xlml`),isNaN(+q(s[0]).Margin)||(f[`!margins`].footer=+q(s[0]).Margin);break;case`pagemargins`:var de=q(s[0]);f[`!margins`]||Fd(f[`!margins`]={},`xlml`),isNaN(+de.Top)||(f[`!margins`].top=+de.Top),isNaN(+de.Left)||(f[`!margins`].left=+de.Left),isNaN(+de.Right)||(f[`!margins`].right=+de.Right),isNaN(+de.Bottom)||(f[`!margins`].bottom=+de.Bottom);break;case`displayrighttoleft`:V.Views||=[],V.Views[0]||(V.Views[0]={}),V.Views[0].RTL=!0;break;case`freezepanes`:break;case`frozennosplit`:break;case`splithorizontal`:case`splitvertical`:break;case`donotdisplaygridlines`:break;case`activerow`:break;case`activecol`:break;case`toprowbottompane`:break;case`leftcolumnrightpane`:break;case`unsynced`:break;case`print`:break;case`printerrors`:break;case`panes`:break;case`scale`:break;case`pane`:break;case`number`:break;case`layout`:break;case`pagesetup`:break;case`selected`:break;case`protectobjects`:break;case`enableselection`:break;case`protectscenarios`:break;case`validprinterinfo`:break;case`horizontalresolution`:break;case`verticalresolution`:break;case`numberofcopies`:break;case`activepane`:break;case`toprowvisible`:break;case`leftcolumnvisible`:break;case`fittopage`:break;case`rangeselection`:break;case`papersizeindex`:break;case`pagelayoutzoom`:break;case`pagebreakzoom`:break;case`filteron`:break;case`fitwidth`:break;case`fitheight`:break;case`commentslayout`:break;case`zoom`:break;case`lefttoright`:break;case`gridlines`:break;case`allowsort`:break;case`allowfilter`:break;case`allowinsertrows`:break;case`allowdeleterows`:break;case`allowinsertcols`:break;case`allowdeletecols`:break;case`allowinserthyperlinks`:break;case`allowformatcells`:break;case`allowsizecols`:break;case`allowsizerows`:break;case`nosummaryrowsbelowdetail`:f[`!outline`]||={},f[`!outline`].above=!0;break;case`tabcolorindex`:break;case`donotdisplayheadings`:break;case`showpagelayoutzoom`:break;case`nosummarycolumnsrightdetail`:f[`!outline`]||={},f[`!outline`].left=!0;break;case`blackandwhite`:break;case`donotdisplayzeros`:break;case`displaypagebreak`:break;case`rowcolheadings`:break;case`donotdisplayoutline`:break;case`noorientation`:break;case`allowusepivottables`:break;case`zeroheight`:break;case`viewablerange`:break;case`selection`:break;case`protectcontents`:break;default:ue=!1}break;case`pivottable`:case`pivotcache`:switch(s[3]){case`immediateitemsondrop`:break;case`showpagemultipleitemlabel`:break;case`compactrowindent`:break;case`location`:break;case`pivotfield`:break;case`orientation`:break;case`layoutform`:break;case`layoutsubtotallocation`:break;case`layoutcompactrow`:break;case`position`:break;case`pivotitem`:break;case`datatype`:break;case`datafield`:break;case`sourcename`:break;case`parentfield`:break;case`ptlineitems`:break;case`ptlineitem`:break;case`countofsameitems`:break;case`item`:break;case`itemtype`:break;case`ptsource`:break;case`cacheindex`:break;case`consolidationreference`:break;case`filename`:break;case`reference`:break;case`nocolumngrand`:break;case`norowgrand`:break;case`blanklineafteritems`:break;case`hidden`:break;case`subtotal`:break;case`basefield`:break;case`mapchilditems`:break;case`function`:break;case`refreshonfileopen`:break;case`printsettitles`:break;case`mergelabels`:break;case`defaultversion`:break;case`refreshname`:break;case`refreshdate`:break;case`refreshdatecopy`:break;case`versionlastrefresh`:break;case`versionlastupdate`:break;case`versionupdateablemin`:break;case`versionrefreshablemin`:break;case`calculation`:break;default:ue=!1}break;case`pagebreaks`:switch(s[3]){case`colbreaks`:break;case`colbreak`:break;case`rowbreaks`:break;case`rowbreak`:break;case`colstart`:break;case`colend`:break;case`rowend`:break;default:ue=!1}break;case`autofilter`:switch(s[3]){case`autofiltercolumn`:break;case`autofiltercondition`:break;case`autofilterand`:break;case`autofilteror`:break;default:ue=!1}break;case`querytable`:switch(s[3]){case`id`:break;case`autoformatfont`:break;case`autoformatpattern`:break;case`querysource`:break;case`querytype`:break;case`enableredirections`:break;case`refreshedinxl9`:break;case`urlstring`:break;case`htmltables`:break;case`connection`:break;case`commandtext`:break;case`refreshinfo`:break;case`notitles`:break;case`nextid`:break;case`columninfo`:break;case`overwritecells`:break;case`donotpromptforfile`:break;case`textwizardsettings`:break;case`source`:break;case`number`:break;case`decimal`:break;case`thousandseparator`:break;case`trailingminusnumbers`:break;case`formatsettings`:break;case`fieldtype`:break;case`delimiters`:break;case`tab`:break;case`comma`:break;case`autoformatname`:break;case`versionlastedit`:break;case`versionlastrefresh`:break;default:ue=!1}break;case`datavalidation`:switch(s[3]){case`range`:break;case`type`:break;case`min`:break;case`max`:break;case`sort`:break;case`descending`:break;case`order`:break;case`casesensitive`:break;case`value`:break;case`errorstyle`:break;case`errormessage`:break;case`errortitle`:break;case`inputmessage`:break;case`inputtitle`:break;case`combohide`:break;case`inputhide`:break;case`condition`:break;case`qualifier`:break;case`useblank`:break;case`value1`:break;case`value2`:break;case`format`:break;case`cellrangelist`:break;default:ue=!1}break;case`sorting`:case`conditionalformatting`:switch(s[3]){case`range`:break;case`type`:break;case`min`:break;case`max`:break;case`sort`:break;case`descending`:break;case`order`:break;case`casesensitive`:break;case`value`:break;case`errorstyle`:break;case`errormessage`:break;case`errortitle`:break;case`cellrangelist`:break;case`inputmessage`:break;case`inputtitle`:break;case`combohide`:break;case`inputhide`:break;case`condition`:break;case`qualifier`:break;case`useblank`:break;case`value1`:break;case`value2`:break;case`format`:break;default:ue=!1}break;case`mapinfo`:case`schema`:case`data`:switch(s[3]){case`map`:break;case`entry`:break;case`range`:break;case`xpath`:break;case`field`:break;case`xsdtype`:break;case`filteron`:break;case`aggregate`:break;case`elementtype`:break;case`attributetype`:break;case`schema`:case`element`:case`complextype`:case`datatype`:case`all`:case`attribute`:case`extends`:break;case`row`:break;default:ue=!1}break;case`smarttags`:break;default:ue=!1;break}if(ue||s[3].match(/!\[CDATA/))break;if(!c[c.length-1][1])throw`Unrecognized tag: `+s[3]+`|`+c.join(`|`);if(c[c.length-1][0]===`customdocumentproperties`){if(s[0].slice(-2)===`/>`)break;s[1]===`/`?bp(D,H,A,r.slice(k,s.index)):(A=s,k=s.index+s[0].length);break}if(n.WTF)throw`Unrecognized tag: `+s[3]+`|`+c.join(`|`)}var fe={};return!n.bookSheets&&!n.bookProps&&(fe.Sheets=u),fe.SheetNames=d,fe.Workbook=V,fe.SSF=zt(G),fe.Props=E,fe.Custprops=D,fe.bookType=`xlml`,fe}function Dp(e,t){switch(Nm(t||={}),t.type||`base64`){case`base64`:return Ep(H(e),t);case`binary`:case`buffer`:case`file`:return Ep(e,t);case`array`:return Ep(ce(e),t)}}function Op(e){var t={},n=e.content;if(n.l=28,t.AnsiUserType=n.read_shift(0,`lpstr-ansi`),t.AnsiClipboardFormat=ki(n),n.length-n.l<=4)return t;var r=n.read_shift(4);if(r==0||r>40||(n.l-=4,t.Reserved1=n.read_shift(0,`lpstr-ansi`),n.length-n.l<=4)||(r=n.read_shift(4),r!==1907505652)||(t.UnicodeClipboardFormat=Ai(n),r=n.read_shift(4),r==0||r>40))return t;n.l-=4,t.Reserved2=n.read_shift(0,`lpwstr`)}var kp=[60,1084,2066,2165,2175];function Ap(e,t,n,r,i){var a=r,o=[],s=n.slice(n.l,n.l+a);if(i&&i.enc&&i.enc.insitu&&s.length>0)switch(e){case 9:case 521:case 1033:case 2057:case 47:case 405:case 225:case 406:case 312:case 404:case 10:break;case 133:break;default:i.enc.insitu(s)}o.push(s),n.l+=a;for(var c=Tr(n,n.l),l=Rp[c],u=0;l!=null&&kp.indexOf(c)>-1;)a=Tr(n,n.l+2),u=n.l+4,c==2066?u+=4:(c==2165||c==2175)&&(u+=12),s=n.slice(u,n.l+4+a),o.push(s),n.l+=4+a,l=Rp[c=Tr(n,n.l)];var d=ue(o);Ir(d,0);var f=0;d.lens=[];for(var p=0;p<o.length;++p)d.lens.push(f),f+=o[p].length;if(d.length<r)throw`XLS Record 0x`+e.toString(16)+` Truncated: `+d.length+` < `+r;return t.f(d,d.length,i)}function jp(e,t,n){if(e.t!==`z`&&e.XF){var r=0;try{r=e.z||e.XF.numFmtId||0,t.cellNF&&e.z==null&&(e.z=G[r])}catch(e){if(t.WTF)throw e}if(!t||t.cellText!==!1)try{e.t===`e`?e.w=e.w||Xi[e.v]:r===0||r==`General`?e.t===`n`?(e.v|0)===e.v?e.w=e.v.toString(10):e.w=Fe(e.v):e.w=Ie(e.v):e.w=mt(r,e.v,{date1904:!!n,dateNF:t&&t.dateNF})}catch(e){if(t.WTF)throw e}if(t.cellDates&&r&&e.t==`n`&&lt(G[r]||String(r))){var i=Ae(e.v+(n?1462:0));i&&(e.t=`d`,e.v=new Date(Date.UTC(i.y,i.m-1,i.d,i.H,i.M,i.S,i.u)))}}}function Mp(e,t,n){return{v:e,ixfe:t,t:n}}function Np(e,t){var n={opts:{}},r={};z!=null&&t.dense==null&&(t.dense=z);var i={};t.dense&&(i[`!data`]=[]);var a={},o={},s=null,c=[],l=``,u={},d,f=``,p,m,h,g,_={},v=[],y,b,x=[],S=[],C={Sheets:[],WBProps:{date1904:!1},Views:[{}]},w={},T=!1,E=function(e){return e<8?Yi[e]:e<64&&S[e-8]||Yi[e]},D=function(e,t){var n=e.XF.data;if(!(!n||!n.patternType||!t||!t.cellStyles)){e.s={},e.s.patternType=n.patternType;var r;(r=bc(E(n.icvFore)))&&(e.s.fgColor={rgb:r}),(r=bc(E(n.icvBack)))&&(e.s.bgColor={rgb:r})}},O=function(e,t,n){if(!(!T&&ne>1)&&!(n.sheetRows&&e.r>=n.sheetRows)){if(n.cellStyles&&t.XF&&t.XF.data&&D(t,n),delete t.ixfe,delete t.XF,d=e,f=ti(e),(!o||!o.s||!o.e)&&(o={s:{r:0,c:0},e:{r:0,c:0}}),e.r<o.s.r&&(o.s.r=e.r),e.c<o.s.c&&(o.s.c=e.c),e.r+1>o.e.r&&(o.e.r=e.r+1),e.c+1>o.e.c&&(o.e.c=e.c+1),n.cellFormula&&t.f){for(var r=0;r<v.length;++r)if(!(v[r][0].s.c>e.c||v[r][0].s.r>e.r)&&!(v[r][0].e.c<e.c||v[r][0].e.r<e.r)){t.F=ri(v[r][0]),(v[r][0].s.c!=e.c||v[r][0].s.r!=e.r)&&delete t.f,t.f&&=``+gd(v[r][1],o,e,I,k);break}}n.dense?(i[`!data`][e.r]||(i[`!data`][e.r]=[]),i[`!data`][e.r][e.c]=t):i[f]=t}},k={enc:!1,sbcch:0,snames:[],sharedf:_,arrayf:v,rrtabid:[],lastuser:``,biff:8,codepage:0,winlocked:0,cellStyles:!!t&&!!t.cellStyles,WTF:!!t&&!!t.wtf};t.password&&(k.password=t.password);var A,j=[],M=[],P=[],ee=[],F=!1,I=[];I.SheetNames=k.snames,I.sharedf=k.sharedf,I.arrayf=k.arrayf,I.names=[],I.XTI=[];var te=0,ne=0,L=0,R=[],B=[],V;k.codepage=1200,N(1200);for(var re=!1;e.l<e.length-1;){var H=e.l,U=e.read_shift(2);if(U===0&&te===10)break;var ie=e.l===e.length?0:e.read_shift(2),ae=Rp[U];if(ne==0&&[9,521,1033,2057].indexOf(U)==-1)break;if(ae&&ae.f){if(t.bookSheets&&te===133&&U!==133)break;if(te=U,ae.r===2||ae.r==12){var oe=e.read_shift(2);if(ie-=2,!k.enc&&oe!==U&&((oe&255)<<8|oe>>8)!==U)throw Error(`rt mismatch: `+oe+`!=`+U);ae.r==12&&(e.l+=10,ie-=10)}var W={};if(W=U===10?ae.f(e,ie,k):Ap(U,ae,e,ie,k),ne==0&&[9,521,1033,2057].indexOf(te)===-1)continue;switch(U){case 34:n.opts.Date1904=C.WBProps.date1904=W;break;case 134:n.opts.WriteProtect=!0;break;case 47:if(k.enc||(e.l=0),k.enc=W,!t.password)throw Error(`File is password-protected`);if(W.valid==null)throw Error(`Encryption scheme unsupported`);if(!W.valid)throw Error(`Password is incorrect`);break;case 92:k.lastuser=W;break;case 66:var se=Number(W);switch(se){case 21010:se=1200;break;case 32768:se=1e4;break;case 32769:se=1252;break}N(k.codepage=se),re=!0;break;case 317:k.rrtabid=W;break;case 25:k.winlocked=W;break;case 439:n.opts.RefreshAll=W;break;case 12:n.opts.CalcCount=W;break;case 16:n.opts.CalcDelta=W;break;case 17:n.opts.CalcIter=W;break;case 13:n.opts.CalcMode=W;break;case 14:n.opts.CalcPrecision=W;break;case 95:n.opts.CalcSaveRecalc=W;break;case 15:k.CalcRefMode=W;break;case 2211:n.opts.FullCalc=W;break;case 129:W.fDialog&&(i[`!type`]=`dialog`),W.fBelow||((i[`!outline`]||={}).above=!0),W.fRight||((i[`!outline`]||={}).left=!0);break;case 67:case 579:case 1091:case 224:x.push(W);break;case 430:I.push([W]),I[I.length-1].XTI=[];break;case 35:case 547:I[I.length-1].push(W);break;case 24:case 536:V={Name:W.Name,Ref:gd(W.rgce,o,null,I,k)},W.itab>0&&(V.Sheet=W.itab-1),I.names.push(V),I[0]||(I[0]=[],I[0].XTI=[]),I[I.length-1].push(W),W.Name==`_xlnm._FilterDatabase`&&W.itab>0&&W.rgce&&W.rgce[0]&&W.rgce[0][0]&&W.rgce[0][0][0]==`PtgArea3d`&&(B[W.itab-1]={ref:ri(W.rgce[0][0][1][2])});break;case 22:k.ExternCount=W;break;case 23:I.length==0&&(I[0]=[],I[0].XTI=[]),I[I.length-1].XTI=I[I.length-1].XTI.concat(W),I.XTI=I.XTI.concat(W);break;case 2196:if(k.biff<8)break;V!=null&&(V.Comment=W[1]);break;case 18:i[`!protect`]=W;break;case 19:W!==0&&k.WTF&&console.error(`Password verifier: `+W);break;case 133:a[k.biff==4?k.snames.length:W.pos]=W,k.snames.push(W.name);break;case 10:if(--ne?!T:T)break;if(o.e){if(o.e.r>0&&o.e.c>0){if(o.e.r--,o.e.c--,i[`!ref`]=ri(o),t.sheetRows&&t.sheetRows<=o.e.r){var ce=o.e.r;o.e.r=t.sheetRows-1,i[`!fullref`]=i[`!ref`],i[`!ref`]=ri(o),o.e.r=ce}o.e.r++,o.e.c++}j.length>0&&(i[`!merges`]=j),M.length>0&&(i[`!objects`]=M),P.length>0&&(i[`!cols`]=P),ee.length>0&&(i[`!rows`]=ee),C.Sheets.push(w)}l===``?u=i:r[l]=i,i={},t.dense&&(i[`!data`]=[]);break;case 9:case 521:case 1033:case 2057:if(k.biff===8&&(k.biff={9:2,521:3,1033:4}[U]||{512:2,768:3,1024:4,1280:5,1536:8,2:2,7:2}[W.BIFFVer]||8),k.biffguess=W.BIFFVer==0,W.BIFFVer==0&&W.dt==4096&&(k.biff=5,re=!0,N(k.codepage=28591)),k.biff==4&&W.dt&256&&(T=!0),k.biff==8&&W.BIFFVer==0&&W.dt==16&&(k.biff=2),ne++&&!T)break;if(i={},t.dense&&(i[`!data`]=[]),k.biff<8&&!re&&(re=!0,N(k.codepage=t.codepage||1252)),k.biff==4&&T)l=(a[k.snames.indexOf(l)+1]||{name:``}).name;else if(k.biff<5||W.BIFFVer==0&&W.dt==4096){l===``&&(l=`Sheet1`),o={s:{r:0,c:0},e:{r:0,c:0}};var le={pos:e.l-ie,name:l};a[le.pos]=le,k.snames.push(l)}else l=(a[H]||{name:``}).name;W.dt==32&&(i[`!type`]=`chart`),W.dt==64&&(i[`!type`]=`macro`),j=[],M=[],k.arrayf=v=[],P=[],ee=[],F=!1,w={Hidden:(a[H]||{hs:0}).hs,name:l};break;case 515:case 3:case 2:i[`!type`]==`chart`&&(t.dense?(i[`!data`][W.r]||[])[W.c]:i[Xr(W.c)+Kr(W.r)])&&++W.c,y={ixfe:W.ixfe,XF:x[W.ixfe]||{},v:W.val,t:`n`},L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O({c:W.c,r:W.r},y,t);break;case 5:case 517:y={ixfe:W.ixfe,XF:x[W.ixfe],v:W.val,t:W.t},L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O({c:W.c,r:W.r},y,t);break;case 638:y={ixfe:W.ixfe,XF:x[W.ixfe],v:W.rknum,t:`n`},L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O({c:W.c,r:W.r},y,t);break;case 189:for(var ue=W.c;ue<=W.C;++ue){var de=W.rkrec[ue-W.c][0];y={ixfe:de,XF:x[de],v:W.rkrec[ue-W.c][1],t:`n`},L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O({c:ue,r:W.r},y,t)}break;case 6:case 518:case 1030:if(W.val==`String`){s=W;break}if(y=Mp(W.val,W.cell.ixfe,W.tt),y.XF=x[y.ixfe],t.cellFormula){var fe=W.formula;if(fe&&fe[0]&&fe[0][0]&&fe[0][0][0]==`PtgExp`){var pe=fe[0][0][1][0],me=fe[0][0][1][1],he=ti({r:pe,c:me});_[he]?y.f=``+gd(W.formula,o,W.cell,I,k):y.F=((t.dense?(i[`!data`][pe]||[])[me]:i[he])||{}).F}else y.f=``+gd(W.formula,o,W.cell,I,k)}L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O(W.cell,y,t),s=W;break;case 7:case 519:if(s)s.val=W,y=Mp(W,s.cell.ixfe,`s`),y.XF=x[y.ixfe],t.cellFormula&&(y.f=``+gd(s.formula,o,s.cell,I,k)),L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O(s.cell,y,t),s=null;else throw Error(`String record expects Formula`);break;case 33:case 545:v.push(W);var ge=ti(W[0].s);if(p=t.dense?(i[`!data`][W[0].s.r]||[])[W[0].s.c]:i[ge],t.cellFormula&&p){if(!s||!ge||!p)break;p.f=``+gd(W[1],o,W[0],I,k),p.F=ri(W[0])}break;case 1212:if(!t.cellFormula)break;if(f){if(!s)break;_[ti(s.cell)]=W[0],p=t.dense?(i[`!data`][s.cell.r]||[])[s.cell.c]:i[ti(s.cell)],(p||{}).f=``+gd(W[0],o,d,I,k)}break;case 253:y=Mp(c[W.isst].t,W.ixfe,`s`),c[W.isst].h&&(y.h=c[W.isst].h),y.XF=x[y.ixfe],L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O({c:W.c,r:W.r},y,t);break;case 513:t.sheetStubs&&(y={ixfe:W.ixfe,XF:x[W.ixfe],t:`z`},L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O({c:W.c,r:W.r},y,t));break;case 190:if(t.sheetStubs)for(var _e=W.c;_e<=W.C;++_e){var ve=W.ixfe[_e-W.c];y={ixfe:ve,XF:x[ve],t:`z`},L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O({c:_e,r:W.r},y,t)}break;case 214:case 516:case 4:y=Mp(W.val,W.ixfe,`s`),y.XF=x[y.ixfe],L>0&&(y.z=y.XF&&y.XF.numFmtId&&R[y.XF.numFmtId]||R[y.ixfe>>8&63]),jp(y,t,n.opts.Date1904),O({c:W.c,r:W.r},y,t);break;case 0:case 512:ne===1&&(o=W);break;case 252:c=W;break;case 1054:if(k.biff>=3&&k.biff<=4){R[L++]=W[1];for(var ye=0;ye<L+163&&G[ye]!=W[1];++ye);ye>=163&&St(W[1],L+163)}else St(W[1],W[0]);break;case 30:R[L++]=W;for(var be=0;be<L+163&&G[be]!=W;++be);be>=163&&St(W,L+163);break;case 229:j=j.concat(W);break;case 93:M[W.cmo[0]]=k.lastobj=W;break;case 438:k.lastobj.TxO=W;break;case 127:k.lastobj.ImData=W;break;case 440:for(g=W[0].s.r;g<=W[0].e.r;++g)for(h=W[0].s.c;h<=W[0].e.c;++h)p=t.dense?(i[`!data`][g]||[])[h]:i[ti({c:h,r:g})],p&&(p.l=W[1]);break;case 2048:for(g=W[0].s.r;g<=W[0].e.r;++g)for(h=W[0].s.c;h<=W[0].e.c;++h)p=t.dense?(i[`!data`][g]||[])[h]:i[ti({c:h,r:g})],p&&p.l&&(p.l.Tooltip=W[1]);break;case 28:if(p=t.dense?(i[`!data`][W[0].r]||[])[W[0].c]:i[ti(W[0])],p||(t.dense?(i[`!data`][W[0].r]||(i[`!data`][W[0].r]=[]),p=i[`!data`][W[0].r][W[0].c]={t:`z`}):p=i[ti(W[0])]={t:`z`},o.e.r=Math.max(o.e.r,W[0].r),o.s.r=Math.min(o.s.r,W[0].r),o.e.c=Math.max(o.e.c,W[0].c),o.s.c=Math.min(o.s.c,W[0].c)),p.c||=[],k.biff<=5&&k.biff>=2)m={a:`SheetJ5`,t:W[1]};else{var xe=M[W[2]];m={a:W[1],t:xe.TxO.t},W[3]!=null&&!(W[3]&2)&&(p.c.hidden=!0)}p.c.push(m);break;case 2173:ul(x[W.ixfe],W.ext);break;case 125:if(!k.cellStyles)break;for(;W.e>=W.s;)P[W.e--]={width:W.w/256,level:W.level||0,hidden:!!(W.flags&1)},F||(F=!0,Mc(W.w/256)),Nc(P[W.e+1]);break;case 520:var Se={};W.level!=null&&(ee[W.r]=Se,Se.level=W.level),W.hidden&&(ee[W.r]=Se,Se.hidden=!0),W.hpt&&(ee[W.r]=Se,Se.hpt=W.hpt,Se.hpx=Ic(W.hpt));break;case 38:case 39:case 40:case 41:i[`!margins`]||Fd(i[`!margins`]={}),i[`!margins`][{38:`left`,39:`right`,40:`top`,41:`bottom`}[U]]=W;break;case 161:i[`!margins`]||Fd(i[`!margins`]={}),i[`!margins`].header=W.header,i[`!margins`].footer=W.footer;break;case 574:W.RTL&&(C.Views[0].RTL=!0);break;case 146:S=W;break;case 2198:A=W;break;case 140:b=W;break;case 442:l?w.CodeName=W||w.name:C.WBProps.CodeName=W||`ThisWorkbook`;break}}else ae||console.error(`Missing Info for XLS Record 0x`+U.toString(16)),e.l+=ie}return n.SheetNames=Et(a).sort(function(e,t){return Number(e)-Number(t)}).map(function(e){return a[e].name}),t.bookSheets||(n.Sheets=r),!n.SheetNames.length&&u[`!ref`]?(n.SheetNames.push(`Sheet1`),n.Sheets&&(n.Sheets.Sheet1=u)):n.Preamble=u,n.Sheets&&B.forEach(function(e,t){n.Sheets[n.SheetNames[t]][`!autofilter`]=e}),n.Strings=c,n.SSF=zt(G),k.enc&&(n.Encryption=k.enc),A&&(n.Themes=A),n.Metadata={},b!==void 0&&(n.Metadata.Country=b),I.names.length>0&&(C.Names=I.names),n.Workbook=C,n}var Pp={SI:`e0859ff2f94f6810ab9108002b27b3d9`,DSI:`02d5cdd59c2e1b10939708002b2cf9ae`,UDI:`05d5cdd59c2e1b10939708002b2cf9ae`};function Fp(e,t,n){var r=K.find(e,`/!DocumentSummaryInformation`);if(r&&r.size>0)try{var i=Ma(r,Wi,Pp.DSI);for(var a in i)t[a]=i[a]}catch(e){if(n.WTF)throw e}var o=K.find(e,`/!SummaryInformation`);if(o&&o.size>0)try{var s=Ma(o,Gi,Pp.SI);for(var c in s)t[c]??(t[c]=s[c])}catch(e){if(n.WTF)throw e}t.HeadingPairs&&t.TitlesOfParts&&(ua(t.HeadingPairs,t.TitlesOfParts,t,n),delete t.HeadingPairs,delete t.TitlesOfParts)}function Ip(e,t){t||={},Nm(t),P(),t.codepage&&j(t.codepage);var n,r;if(e.FullPaths){if(K.find(e,`/encryption`))throw Error(`File is password-protected`);n=K.find(e,`!CompObj`),r=K.find(e,`/Workbook`)||K.find(e,`/Book`)}else{switch(t.type){case`base64`:e=se(H(e));break;case`binary`:e=se(e);break;case`buffer`:break;case`array`:Array.isArray(e)||(e=Array.prototype.slice.call(e));break}Ir(e,0),r={content:e}}var i,a;if(n&&Op(n),t.bookProps&&!t.bookSheets)i={};else{var o=U?`buffer`:`array`;if(r&&r.content)i=Np(r.content,t);else if((a=K.find(e,`PerfectOffice_MAIN`))&&a.content)i=Fs.to_workbook(a.content,(t.type=o,t));else if((a=K.find(e,`NativeContent_MAIN`))&&a.content)i=Fs.to_workbook(a.content,(t.type=o,t));else if((a=K.find(e,`MN0`))&&a.content)throw Error(`Unsupported Works 4 for Mac file`);else throw Error(`Cannot find Workbook stream`);t.bookVBA&&e.FullPaths&&K.find(e,`/_VBA_PROJECT_CUR/VBA/dir`)&&(i.vbaraw=Al(e))}var s={};return e.FullPaths&&Fp(e,s,t),i.Props=i.Custprops=s,t.bookFiles&&(i.cfb=e),i}var Lp={0:{f:tf},1:{f:of},2:{f:gf},3:{f:uf},4:{f:cf},5:{f:mf},6:{f:yf},7:{f:ff},8:{f:wf},9:{f:Cf},10:{f:xf},11:{f:Sf},12:{f:sf},13:{f:_f},14:{f:df},15:{f:lf},16:{f:hf},17:{f:bf},18:{f:pf},19:{f:hi},20:{},21:{},22:{},23:{},24:{},25:{},26:{},27:{},28:{},29:{},30:{},31:{},32:{},33:{},34:{},35:{T:1},36:{T:-1},37:{T:1},38:{T:-1},39:{f:tp},40:{},42:{},43:{f:qc},44:{f:Kc},45:{f:Jc},46:{f:Xc},47:{f:Yc},48:{},49:{f:fi},50:{},51:{f:fl},52:{T:1},53:{T:-1},54:{T:1},55:{T:-1},56:{T:1},57:{T:-1},58:{},59:{},60:{f:ps},62:{f:vf},63:{f:_l},64:{f:Nf},65:{},66:{},67:{},68:{},69:{},70:{},128:{},129:{T:1},130:{T:-1},131:{T:1,f:Lr,p:0},132:{T:-1},133:{T:1},134:{T:-1},135:{T:1},136:{T:-1},137:{T:1,f:Mf},138:{T:-1},139:{T:1},140:{T:-1},141:{T:1},142:{T:-1},143:{T:1},144:{T:-1},145:{T:1},146:{T:-1},147:{f:af},148:{f:nf,p:16},151:{f:Df},152:{},153:{f:$f},154:{},155:{},156:{f:Qf},157:{},158:{},159:{T:1,f:Gs},160:{T:-1},161:{T:1,f:Ti},162:{T:-1},163:{T:1},164:{T:-1},165:{T:1},166:{T:-1},167:{},168:{},169:{},170:{},171:{},172:{T:1},173:{T:-1},174:{},175:{},176:{f:Tf},177:{T:1},178:{T:-1},179:{T:1},180:{T:-1},181:{T:1},182:{T:-1},183:{T:1},184:{T:-1},185:{T:1},186:{T:-1},187:{T:1},188:{T:-1},189:{T:1},190:{T:-1},191:{T:1},192:{T:-1},193:{T:1},194:{T:-1},195:{T:1},196:{T:-1},197:{T:1},198:{T:-1},199:{T:1},200:{T:-1},201:{T:1},202:{T:-1},203:{T:1},204:{T:-1},205:{T:1},206:{T:-1},207:{T:1},208:{T:-1},209:{T:1},210:{T:-1},211:{T:1},212:{T:-1},213:{T:1},214:{T:-1},215:{T:1},216:{T:-1},217:{T:1},218:{T:-1},219:{T:1},220:{T:-1},221:{T:1},222:{T:-1},223:{T:1},224:{T:-1},225:{T:1},226:{T:-1},227:{T:1},228:{T:-1},229:{T:1},230:{T:-1},231:{T:1},232:{T:-1},233:{T:1},234:{T:-1},235:{T:1},236:{T:-1},237:{T:1},238:{T:-1},239:{T:1},240:{T:-1},241:{T:1},242:{T:-1},243:{T:1},244:{T:-1},245:{T:1},246:{T:-1},247:{T:1},248:{T:-1},249:{T:1},250:{T:-1},251:{T:1},252:{T:-1},253:{T:1},254:{T:-1},255:{T:1},256:{T:-1},257:{T:1},258:{T:-1},259:{T:1},260:{T:-1},261:{T:1},262:{T:-1},263:{T:1},264:{T:-1},265:{T:1},266:{T:-1},267:{T:1},268:{T:-1},269:{T:1},270:{T:-1},271:{T:1},272:{T:-1},273:{T:1},274:{T:-1},275:{T:1},276:{T:-1},277:{},278:{T:1},279:{T:-1},280:{T:1},281:{T:-1},282:{T:1},283:{T:1},284:{T:-1},285:{T:1},286:{T:-1},287:{T:1},288:{T:-1},289:{T:1},290:{T:-1},291:{T:1},292:{T:-1},293:{T:1},294:{T:-1},295:{T:1},296:{T:-1},297:{T:1},298:{T:-1},299:{T:1},300:{T:-1},301:{T:1},302:{T:-1},303:{T:1},304:{T:-1},305:{T:1},306:{T:-1},307:{T:1},308:{T:-1},309:{T:1},310:{T:-1},311:{T:1},312:{T:-1},313:{T:-1},314:{T:1},315:{T:-1},316:{T:1},317:{T:-1},318:{T:1},319:{T:-1},320:{T:1},321:{T:-1},322:{T:1},323:{T:-1},324:{T:1},325:{T:-1},326:{T:1},327:{T:-1},328:{T:1},329:{T:-1},330:{T:1},331:{T:-1},332:{T:1},333:{T:-1},334:{T:1},335:{f:dl},336:{T:-1},337:{f:pl,T:1},338:{T:-1},339:{T:1},340:{T:-1},341:{T:1},342:{T:-1},343:{T:1},344:{T:-1},345:{T:1},346:{T:-1},347:{T:1},348:{T:-1},349:{T:1},350:{T:-1},351:{},352:{},353:{T:1},354:{T:-1},355:{f:Si},357:{},358:{},359:{},360:{T:1},361:{},362:{f:Jo},363:{},364:{},366:{},367:{},368:{},369:{},370:{},371:{},372:{T:1},373:{T:-1},374:{T:1},375:{T:-1},376:{T:1},377:{T:-1},378:{T:1},379:{T:-1},380:{T:1},381:{T:-1},382:{T:1},383:{T:-1},384:{T:1},385:{T:-1},386:{T:1},387:{T:-1},388:{T:1},389:{T:-1},390:{T:1},391:{T:-1},392:{T:1},393:{T:-1},394:{T:1},395:{T:-1},396:{},397:{},398:{},399:{},400:{},401:{T:1},403:{},404:{},405:{},406:{},407:{},408:{},409:{},410:{},411:{},412:{},413:{},414:{},415:{},416:{},417:{},418:{},419:{},420:{},421:{},422:{T:1},423:{T:1},424:{T:-1},425:{T:-1},426:{f:Of},427:{f:kf},428:{},429:{T:1},430:{T:-1},431:{T:1},432:{T:-1},433:{T:1},434:{T:-1},435:{T:1},436:{T:-1},437:{T:1},438:{T:-1},439:{T:1},440:{T:-1},441:{T:1},442:{T:-1},443:{T:1},444:{T:-1},445:{T:1},446:{T:-1},447:{T:1},448:{T:-1},449:{T:1},450:{T:-1},451:{T:1},452:{T:-1},453:{T:1},454:{T:-1},455:{T:1},456:{T:-1},457:{T:1},458:{T:-1},459:{T:1},460:{T:-1},461:{T:1},462:{T:-1},463:{T:1},464:{T:-1},465:{T:1},466:{T:-1},467:{T:1},468:{T:-1},469:{T:1},470:{T:-1},471:{},472:{},473:{T:1},474:{T:-1},475:{},476:{f:jf},477:{},478:{},479:{T:1},480:{T:-1},481:{T:1},482:{T:-1},483:{T:1},484:{T:-1},485:{f:rf},486:{T:1},487:{T:-1},488:{T:1},489:{T:-1},490:{T:1},491:{T:-1},492:{T:1},493:{T:-1},494:{f:Ef},495:{T:1},496:{T:-1},497:{T:1},498:{T:-1},499:{},500:{T:1},501:{T:-1},502:{T:1},503:{T:-1},504:{},505:{T:1},506:{T:-1},507:{},508:{T:1},509:{T:-1},510:{T:1},511:{T:-1},512:{},513:{},514:{T:1},515:{T:-1},516:{T:1},517:{T:-1},518:{T:1},519:{T:-1},520:{T:1},521:{T:-1},522:{},523:{},524:{},525:{},526:{},527:{},528:{T:1},529:{T:-1},530:{T:1},531:{T:-1},532:{T:1},533:{T:-1},534:{},535:{},536:{},537:{},538:{T:1},539:{T:-1},540:{T:1},541:{T:-1},542:{T:1},548:{},549:{},550:{f:Si},551:{f:bi},552:{},553:{},554:{T:1},555:{T:-1},556:{T:1},557:{T:-1},558:{T:1},559:{T:-1},560:{T:1},561:{T:-1},562:{},564:{},565:{T:1},566:{T:-1},569:{T:1},570:{T:-1},572:{},573:{T:1},574:{T:-1},577:{},578:{},579:{},580:{},581:{},582:{},583:{},584:{},585:{},586:{},587:{},588:{T:-1},589:{},590:{T:1},591:{T:-1},592:{T:1},593:{T:-1},594:{T:1},595:{T:-1},596:{},597:{T:1},598:{T:-1},599:{T:1},600:{T:-1},601:{T:1},602:{T:-1},603:{T:1},604:{T:-1},605:{T:1},606:{T:-1},607:{},608:{T:1},609:{T:-1},610:{},611:{T:1},612:{T:-1},613:{T:1},614:{T:-1},615:{T:1},616:{T:-1},617:{T:1},618:{T:-1},619:{T:1},620:{T:-1},625:{},626:{T:1},627:{T:-1},628:{T:1},629:{T:-1},630:{T:1},631:{T:-1},632:{f:Dl},633:{T:1},634:{T:-1},635:{T:1,f:El},636:{T:-1},637:{f:gi},638:{T:1},639:{},640:{T:-1},641:{T:1},642:{T:-1},643:{T:1},644:{},645:{T:-1},646:{T:1},648:{T:1},649:{},650:{T:-1},651:{f:zf},652:{},653:{T:1},654:{T:-1},655:{T:1},656:{T:-1},657:{T:1},658:{T:-1},659:{},660:{T:1},661:{},662:{T:-1},663:{},664:{T:1},665:{},666:{T:-1},667:{},668:{},669:{},671:{T:1},672:{T:-1},673:{T:1},674:{T:-1},675:{},676:{},677:{},678:{},679:{},680:{},681:{},1024:{},1025:{},1026:{T:1},1027:{T:-1},1028:{T:1},1029:{T:-1},1030:{},1031:{T:1},1032:{T:-1},1033:{T:1},1034:{T:-1},1035:{},1036:{},1037:{},1038:{T:1},1039:{T:-1},1040:{},1041:{T:1},1042:{T:-1},1043:{},1044:{},1045:{},1046:{T:1},1047:{T:-1},1048:{T:1},1049:{T:-1},1050:{},1051:{T:1},1052:{T:1},1053:{f:Pf},1054:{T:1},1055:{},1056:{T:1},1057:{T:-1},1058:{T:1},1059:{T:-1},1061:{},1062:{T:1},1063:{T:-1},1064:{T:1},1065:{T:-1},1066:{T:1},1067:{T:-1},1068:{T:1},1069:{T:-1},1070:{T:1},1071:{T:-1},1072:{T:1},1073:{T:-1},1075:{T:1},1076:{T:-1},1077:{T:1},1078:{T:-1},1079:{T:1},1080:{T:-1},1081:{T:1},1082:{T:-1},1083:{T:1},1084:{T:-1},1085:{},1086:{T:1},1087:{T:-1},1088:{T:1},1089:{T:-1},1090:{T:1},1091:{T:-1},1092:{T:1},1093:{T:-1},1094:{T:1},1095:{T:-1},1096:{},1097:{T:1},1098:{},1099:{T:-1},1100:{T:1},1101:{T:-1},1102:{},1103:{},1104:{},1105:{},1111:{},1112:{},1113:{T:1},1114:{T:-1},1115:{T:1},1116:{T:-1},1117:{},1118:{T:1},1119:{T:-1},1120:{T:1},1121:{T:-1},1122:{T:1},1123:{T:-1},1124:{T:1},1125:{T:-1},1126:{},1128:{T:1},1129:{T:-1},1130:{},1131:{T:1},1132:{T:-1},1133:{T:1},1134:{T:-1},1135:{T:1},1136:{T:-1},1137:{T:1},1138:{T:-1},1139:{T:1},1140:{T:-1},1141:{},1142:{T:1},1143:{T:-1},1144:{T:1},1145:{T:-1},1146:{},1147:{T:1},1148:{T:-1},1149:{T:1},1150:{T:-1},1152:{T:1},1153:{T:-1},1154:{T:-1},1155:{T:-1},1156:{T:-1},1157:{T:1},1158:{T:-1},1159:{T:1},1160:{T:-1},1161:{T:1},1162:{T:-1},1163:{T:1},1164:{T:-1},1165:{T:1},1166:{T:-1},1167:{T:1},1168:{T:-1},1169:{T:1},1170:{T:-1},1171:{},1172:{T:1},1173:{T:-1},1177:{},1178:{T:1},1180:{},1181:{},1182:{},2048:{T:1},2049:{T:-1},2050:{},2051:{T:1},2052:{T:-1},2053:{},2054:{},2055:{T:1},2056:{T:-1},2057:{T:1},2058:{T:-1},2060:{},2067:{},2068:{T:1},2069:{T:-1},2070:{},2071:{},2072:{T:1},2073:{T:-1},2075:{},2076:{},2077:{T:1},2078:{T:-1},2079:{},2080:{T:1},2081:{T:-1},2082:{},2083:{T:1},2084:{T:-1},2085:{T:1},2086:{T:-1},2087:{T:1},2088:{T:-1},2089:{T:1},2090:{T:-1},2091:{},2092:{},2093:{T:1},2094:{T:-1},2095:{},2096:{T:1},2097:{T:-1},2098:{T:1},2099:{T:-1},2100:{T:1},2101:{T:-1},2102:{},2103:{T:1},2104:{T:-1},2105:{},2106:{T:1},2107:{T:-1},2108:{},2109:{T:1},2110:{T:-1},2111:{T:1},2112:{T:-1},2113:{T:1},2114:{T:-1},2115:{},2116:{},2117:{},2118:{T:1},2119:{T:-1},2120:{},2121:{T:1},2122:{T:-1},2123:{T:1},2124:{T:-1},2125:{},2126:{T:1},2127:{T:-1},2128:{},2129:{T:1},2130:{T:-1},2131:{T:1},2132:{T:-1},2133:{T:1},2134:{},2135:{},2136:{},2137:{T:1},2138:{T:-1},2139:{T:1},2140:{T:-1},2141:{},3072:{},3073:{},4096:{T:1},4097:{T:-1},5002:{T:1},5003:{T:-1},5081:{T:1},5082:{T:-1},5083:{},5084:{T:1},5085:{T:-1},5086:{T:1},5087:{T:-1},5088:{},5089:{},5090:{},5092:{T:1},5093:{T:-1},5094:{},5095:{T:1},5096:{T:-1},5097:{},5099:{},65535:{n:``}},Rp={6:{f:Sd},10:{f:Na},12:{f:Ia},13:{f:Ia},14:{f:Fa},15:{f:Fa},16:{f:J},17:{f:Fa},18:{f:Fa},19:{f:Ia},20:{f:Wo},21:{f:Wo},23:{f:Jo},24:{f:qo},25:{f:Fa},26:{},27:{},28:{f:ts},29:{},34:{f:Fa},35:{f:Ko},38:{f:J},39:{f:J},40:{f:J},41:{f:J},42:{f:Fa},43:{f:Fa},47:{f:hc},49:{f:Do},51:{f:Ia},60:{},61:{f:wo},64:{f:Fa},65:{f:Eo},66:{f:Ia},77:{},80:{},81:{},82:{},85:{f:Ia},89:{},90:{},91:{},92:{f:ho},93:{f:rs},94:{},95:{f:Fa},96:{},97:{},99:{f:Fa},125:{f:ps},128:{f:Vo},129:{f:go},130:{f:Ia},131:{f:Fa},132:{f:Fa},133:{f:_o},134:{},140:{f:ls},141:{f:Ia},144:{},146:{f:ds},151:{},152:{},153:{},154:{},155:{},156:{f:Ia},157:{},158:{},160:{f:_s},161:{f:ms},174:{},175:{},176:{},177:{},178:{},180:{},181:{},182:{},184:{},185:{},189:{f:Po},190:{f:Fo},193:{f:Na},197:{},198:{},199:{},200:{},201:{},202:{f:Fa},203:{},204:{},205:{},206:{},207:{},208:{},209:{},210:{},211:{},213:{},215:{},216:{},217:{},218:{f:Ia},220:{},221:{f:Fa},222:{},224:{f:Lo},225:{f:mo},226:{f:Na},227:{},229:{f:ns},233:{},235:{},236:{},237:{},239:{},240:{},241:{},242:{},244:{},245:{},246:{},247:{},248:{},249:{},251:{},252:{f:vo},253:{f:Oo},255:{f:yo},256:{},259:{},290:{},311:{},312:{},315:{},317:{f:La},318:{},319:{},320:{},330:{},331:{},333:{},334:{},335:{},336:{},337:{},338:{},339:{},340:{},351:{},352:{f:Fa},353:{f:Na},401:{},402:{},403:{},404:{},405:{},406:{},407:{},408:{},425:{},426:{},427:{},428:{},429:{},430:{f:Go},431:{f:Fa},432:{},433:{},434:{},437:{},438:{f:os},439:{f:Fa},440:{f:ss},441:{},442:{f:Ha},443:{},444:{f:Ia},445:{},446:{},448:{f:Na},449:{f:So,r:2},450:{f:Na},512:{f:Mo},513:{f:gs},515:{f:Uo},516:{f:ko},517:{f:Ho},519:{f:vs},520:{f:bo},523:{},545:{f:Qo},549:{f:Co},566:{},574:{f:To},638:{f:No},659:{},1048:{},1054:{f:Ao},1084:{},1212:{f:Zo},2048:{f:cs},2049:{},2050:{},2051:{},2052:{},2053:{},2054:{},2055:{},2056:{},2057:{f:po},2058:{},2059:{},2060:{},2061:{},2062:{},2063:{},2064:{},2066:{},2067:{},2128:{},2129:{},2130:{},2131:{},2132:{},2133:{},2134:{},2135:{},2136:{},2137:{},2138:{},2146:{},2147:{r:12},2148:{},2149:{},2150:{},2151:{f:Na},2152:{},2154:{},2155:{},2156:{},2161:{},2162:{},2164:{},2165:{},2166:{},2167:{},2168:{},2169:{},2170:{},2171:{},2172:{f:fs,r:12},2173:{f:ll,r:12},2174:{},2175:{},2180:{},2181:{},2182:{},2183:{},2184:{},2185:{},2186:{},2187:{},2188:{f:Fa,r:12},2189:{},2190:{r:12},2191:{},2192:{},2194:{},2195:{},2196:{f:Xo,r:12},2197:{},2198:{f:rl,r:12},2199:{},2200:{},2201:{},2202:{f:$o,r:12},2203:{f:Na},2204:{},2205:{},2206:{},2207:{},2211:{f:xo},2212:{},2213:{},2214:{},2215:{},4097:{},4098:{},4099:{},4102:{},4103:{},4105:{},4106:{},4107:{},4108:{},4109:{},4116:{},4117:{},4118:{},4119:{},4120:{},4121:{},4122:{},4123:{},4124:{},4125:{},4126:{},4127:{},4128:{},4129:{},4130:{},4132:{},4133:{},4134:{f:Ia},4135:{},4146:{},4147:{},4148:{},4149:{},4154:{},4156:{},4157:{},4158:{},4159:{},4160:{},4161:{},4163:{},4164:{f:hs},4165:{},4166:{},4168:{},4170:{},4171:{},4174:{},4175:{},4176:{},4177:{},4187:{},4188:{f:us},4189:{},4191:{},4192:{},4193:{},4194:{},4195:{},4196:{},4197:{},4198:{},4199:{},4200:{},0:{f:Mo},1:{},2:{f:Ss},3:{f:xs},4:{f:bs},5:{f:ws},7:{f:Cs},8:{},9:{f:po},11:{},22:{f:Ia},30:{f:jo},31:{},32:{},33:{f:Qo},36:{},37:{f:Co},50:{f:Ts},62:{},52:{},67:{f:Ro},68:{f:Ia},69:{},86:{},126:{},127:{f:ys},135:{},136:{},137:{},143:{f:Ds},145:{},148:{},149:{},150:{},169:{},171:{},188:{},191:{},192:{},194:{},195:{},214:{f:Es},223:{},234:{},354:{},421:{},518:{f:Sd},521:{f:po},536:{f:qo},547:{f:Ko},561:{},579:{f:zo},1030:{f:Sd},1033:{f:po},1091:{f:Bo},2157:{},2163:{},2177:{},2240:{},2241:{},2242:{},2243:{},2244:{},2245:{},2246:{},2247:{},2248:{},2249:{},2250:{},2251:{},2262:{r:12},101:{},102:{},105:{},106:{},107:{},109:{},112:{},114:{},29282:{}};function zp(e,t,n,r){var i=t;if(!isNaN(i)){var a=r||(n||[]).length||0,o=e.next(4);o.write_shift(2,i),o.write_shift(2,a),a>0&&Sr(n)&&e.push(n)}}function Bp(e,t){var n=t||{},r=n.dense==null?z:n.dense,i={};r&&(i[`!data`]=[]),e=tn(e,`<!--`,`-->`);var a=e.match(/<table/i);if(!a)throw Error(`Invalid HTML: could not find <table>`);var o=e.match(/<\/table/i),s=a.index,c=o&&o.index||e.length,l=Xt(e.slice(s,c),/(:?<tr[^<>]*>)/i,`<tr>`),u=-1,d=0,f=0,p=0,m={s:{r:1e7,c:1e7},e:{r:0,c:0}},h=[];for(s=0;s<l.length;++s){var g=l[s].trim(),_=g.slice(0,3).toLowerCase();if(_==`<tr`){if(++u,n.sheetRows&&n.sheetRows<=u){--u;break}d=0;continue}if(!(_!=`<td`&&_!=`<th`)){var v=g.split(/<\/t[dh]>/i);for(c=0;c<v.length;++c){var y=v[c].trim();if(y.match(/<t[dh]/i)){for(var b=y,x=0;b.charAt(0)==`<`&&(x=b.indexOf(`>`))>-1;)b=b.slice(x+1);for(var S=0;S<h.length;++S){var C=h[S];C.s.c==d&&C.s.r<u&&u<=C.e.r&&(d=C.e.c+1,S=-1)}var w=q(y.slice(0,y.indexOf(`>`)));p=w.colspan?+w.colspan:1,((f=+w.rowspan)>1||p>1)&&h.push({s:{r:u,c:d},e:{r:u+(f||1)-1,c:d+p-1}});var T=w.t||w[`data-t`]||``;if(!b.length){d+=p;continue}if(b=Un(b),m.s.r>u&&(m.s.r=u),m.e.r<u&&(m.e.r=u),m.s.c>d&&(m.s.c=d),m.e.c<d&&(m.e.c=d),!b.length){d+=p;continue}var E={t:`s`,v:b};n.raw||!b.trim().length||T==`s`||(b===`TRUE`?E={t:`b`,v:!0}:b===`FALSE`?E={t:`b`,v:!1}:isNaN(Vt(b))?isNaN(Yt(b).getDate())?b.charCodeAt(0)==35&&Zi[b]!=null&&(E.t=`e`,E.w=b,E.v=Zi[b]):(E={t:`d`,v:Lt(b)},n.UTC===!1&&(E.v=Zt(E.v)),n.cellDates||(E={t:`n`,v:jt(E.v)}),E.z=n.dateNF||G[14]):E={t:`n`,v:Vt(b)}),E.cellText!==!1&&(E.w=b),r?(i[`!data`][u]||(i[`!data`][u]=[]),i[`!data`][u][d]=E):i[ti({r:u,c:d})]=E,d+=p}}}}return i[`!ref`]=ri(m),h.length&&(i[`!merges`]=h),i}function Vp(e,t,n,r){for(var i=e[`!merges`]||[],a=[],o={},s=e[`!data`]!=null,c=t.s.c;c<=t.e.c;++c){for(var l=0,u=0,d=0;d<i.length;++d)if(!(i[d].s.r>n||i[d].s.c>c)&&!(i[d].e.r<n||i[d].e.c<c)){if(i[d].s.r<n||i[d].s.c<c){l=-1;break}l=i[d].e.r-i[d].s.r+1,u=i[d].e.c-i[d].s.c+1;break}if(!(l<0)){var f=Xr(c)+Kr(n),p=s?(e[`!data`][n]||[])[c]:e[f];p&&p.t==`n`&&p.v!=null&&!isFinite(p.v)&&(p=isNaN(p.v)?{t:`e`,v:36,w:Xi[36]}:{t:`e`,v:7,w:Xi[7]});var m=p&&p.v!=null&&(p.h||Pn(p.w||(si(p),p.w)||``))||``;o={},l>1&&(o.rowspan=l),u>1&&(o.colspan=u),r.editable?m=`<span contenteditable="true">`+m+`</span>`:p&&(o[`data-t`]=p&&p.t||`z`,p.v!=null&&(o[`data-v`]=Pn(p.v instanceof Date?p.v.toISOString():p.v)),p.z!=null&&(o[`data-z`]=p.z),p.l&&(p.l.Target||`#`).charAt(0)!=`#`&&(m=`<a href="`+Pn(p.l.Target)+`">`+m+`</a>`)),o.id=(r.id||`sjs`)+`-`+f,a.push(Yn(`td`,m,o))}}return`<tr>`+a.join(``)+`</tr>`}var Hp=`<html><head><meta charset="utf-8"/><title>SheetJS Table Export</title></head><body>`,Up=`</body></html>`;function Wp(e,t){var n=cn(e,`table`);if(!n||n.length==0)throw Error(`Invalid HTML: could not find <table>`);if(n.length==1){var r=ci(Bp(n[0],t),t);return r.bookType=`html`,r}var i=sh();return n.forEach(function(e,n){ch(i,Bp(e,t),`Sheet`+(n+1))}),i.bookType=`html`,i}function Gp(e,t,n){return[].join(``)+`<table`+(n&&n.id?` id="`+n.id+`"`:``)+`>`}function Kp(e,t){var n=t||{},r=n.header==null?Hp:n.header,i=n.footer==null?Up:n.footer,a=[r],o=ni(e[`!ref`]||`A1`);if(a.push(Gp(e,o,n)),e[`!ref`])for(var s=o.s.r;s<=o.e.r;++s)a.push(Vp(e,o,s,n));return a.push(`</table>`+i),a.join(``)}function qp(e,t,n){var r=t.rows;if(!r)throw`Unsupported origin when `+t.tagName+` is not a TABLE`;var i=n||{},a=e[`!data`]!=null,o=0,s=0;if(i.origin!=null)if(typeof i.origin==`number`)o=i.origin;else{var c=typeof i.origin==`string`?ei(i.origin):i.origin;o=c.r,s=c.c}var l=Math.min(i.sheetRows||1e7,r.length),u={s:{r:0,c:0},e:{r:o,c:s}};if(e[`!ref`]){var d=ni(e[`!ref`]);u.s.r=Math.min(u.s.r,d.s.r),u.s.c=Math.min(u.s.c,d.s.c),u.e.r=Math.max(u.e.r,d.e.r),u.e.c=Math.max(u.e.c,d.e.c),o==-1&&(u.e.r=o=d.e.r+1)}var f=[],p=0,m=e[`!rows`]||=[],h=0,g=0,_=0,v=0,y=0,b=0;for(e[`!cols`]||=[];h<r.length&&g<l;++h){var x=r[h];if(Xp(x)){if(i.display)continue;m[g]={hidden:!0}}var S=x.cells;for(_=v=0;_<S.length;++_){var C=S[_];if(!(i.display&&Xp(C))){var w=C.hasAttribute(`data-v`)?C.getAttribute(`data-v`):C.hasAttribute(`v`)?C.getAttribute(`v`):Un(C.innerHTML),T=C.getAttribute(`data-z`)||C.getAttribute(`z`);for(p=0;p<f.length;++p){var E=f[p];E.s.c==v+s&&E.s.r<g+o&&g+o<=E.e.r&&(v=E.e.c+1-s,p=-1)}b=+C.getAttribute(`colspan`)||1,((y=+C.getAttribute(`rowspan`)||1)>1||b>1)&&f.push({s:{r:g+o,c:v+s},e:{r:g+o+(y||1)-1,c:v+s+(b||1)-1}});var D={t:`s`,v:w},O=C.getAttribute(`data-t`)||C.getAttribute(`t`)||``;w!=null&&(w.length==0?D.t=O||`z`:i.raw||w.trim().length==0||O==`s`||(O==`e`&&Xi[+w]?D={t:`e`,v:+w,w:Xi[+w]}:w===`TRUE`?D={t:`b`,v:!0}:w===`FALSE`?D={t:`b`,v:!1}:isNaN(Vt(w))?isNaN(Yt(w).getDate())?w.charCodeAt(0)==35&&Zi[w]!=null&&(D={t:`e`,v:Zi[w],w}):(D={t:`d`,v:Lt(w)},i.UTC&&(D.v=Qt(D.v)),i.cellDates||(D={t:`n`,v:jt(D.v)}),D.z=i.dateNF||G[14]):D={t:`n`,v:Vt(w)})),D.z===void 0&&T!=null&&(D.z=T);var k=``,A=C.getElementsByTagName(`A`);if(A&&A.length)for(var j=0;j<A.length&&!(A[j].hasAttribute(`href`)&&(k=A[j].getAttribute(`href`),k.charAt(0)!=`#`));++j);k&&k.charAt(0)!=`#`&&k.slice(0,11).toLowerCase()!=`javascript:`&&(D.l={Target:k}),a?(e[`!data`][g+o]||(e[`!data`][g+o]=[]),e[`!data`][g+o][v+s]=D):e[ti({c:v+s,r:g+o})]=D,u.e.c<v+s&&(u.e.c=v+s),v+=b}}++g}return f.length&&(e[`!merges`]=(e[`!merges`]||[]).concat(f)),u.e.r=Math.max(u.e.r,g-1+o),e[`!ref`]=ri(u),g>=l&&(e[`!fullref`]=ri((u.e.r=r.length-h+g-1+o,u))),e}function Jp(e,t){var n=t||{},r={};return n.dense&&(r[`!data`]=[]),qp(r,e,t)}function Yp(e,t){return ci(Jp(e,t),t)}function Xp(e){var t=``,n=Zp(e);return n&&(t=n(e).getPropertyValue(`display`)),t||=e.style&&e.style.display,t===`none`}function Zp(e){return e.ownerDocument.defaultView&&typeof e.ownerDocument.defaultView.getComputedStyle==`function`?e.ownerDocument.defaultView.getComputedStyle:typeof getComputedStyle==`function`?getComputedStyle:null}function Qp(e){return[jn(e.replace(/[\t\r\n]/g,` `).trim().replace(/ +/g,` `).replace(/<text:s\/>/g,` `).replace(/<text:s text:c="(\d+)"\/>/g,function(e,t){return Array(parseInt(t,10)+1).join(` `)}).replace(/<text:tab[^<>]*\/>/g,`	`).replace(/<text:line-break\/>/g,`
`).replace(/<[^<>]*>/g,``))]}function $p(e,t,n){var r=n||{},i=Xn(e);Zn.lastIndex=0,i=$t(tn(i,`<!--`,`-->`));for(var a,o,s=``,c=``,l,u=0,d=-1,f=``;a=Zn.exec(i);)switch(a[3]=a[3].replace(/_[\s\S]*$/,``)){case`number-style`:case`currency-style`:case`percentage-style`:case`date-style`:case`time-style`:case`text-style`:a[1]===`/`?(o[`truncate-on-overflow`]==`false`&&(s.match(/h/)?s=s.replace(/h+/,`[$&]`):s.match(/m/)?s=s.replace(/m+/,`[$&]`):s.match(/s/)&&(s=s.replace(/s+/,`[$&]`))),r[o.name]=s,s=``):a[0].charAt(a[0].length-2)!==`/`&&(s=``,o=q(a[0],!1));break;case`boolean-style`:a[1]===`/`?(r[o.name]=`General`,s=``):a[0].charAt(a[0].length-2)!==`/`&&(s=``,o=q(a[0],!1));break;case`boolean`:s+=`General`;break;case`text`:a[1]===`/`?(f=i.slice(d,Zn.lastIndex-a[0].length),f==`%`&&o[0]==`<number:percentage-style`?s+=`%`:s+=`"`+f.replace(/"/g,`""`)+`"`):a[0].charAt(a[0].length-2)!==`/`&&(d=Zn.lastIndex);break;case`day`:switch(l=q(a[0],!1),l.style){case`short`:s+=`d`;break;case`long`:s+=`dd`;break;default:s+=`dd`;break}break;case`day-of-week`:switch(l=q(a[0],!1),l.style){case`short`:s+=`ddd`;break;case`long`:s+=`dddd`;break;default:s+=`ddd`;break}break;case`era`:switch(l=q(a[0],!1),l.style){case`short`:s+=`ee`;break;case`long`:s+=`eeee`;break;default:s+=`eeee`;break}break;case`hours`:switch(l=q(a[0],!1),l.style){case`short`:s+=`h`;break;case`long`:s+=`hh`;break;default:s+=`hh`;break}break;case`minutes`:switch(l=q(a[0],!1),l.style){case`short`:s+=`m`;break;case`long`:s+=`mm`;break;default:s+=`mm`;break}break;case`month`:switch(l=q(a[0],!1),l.textual&&(s+=`mm`),l.style){case`short`:s+=`m`;break;case`long`:s+=`mm`;break;default:s+=`m`;break}break;case`seconds`:switch(l=q(a[0],!1),l.style){case`short`:s+=`s`;break;case`long`:s+=`ss`;break;default:s+=`ss`;break}l[`decimal-places`]&&(s+=`.`+Bt(`0`,+l[`decimal-places`]));break;case`year`:switch(l=q(a[0],!1),l.style){case`short`:s+=`yy`;break;case`long`:s+=`yyyy`;break;default:s+=`yy`;break}break;case`am-pm`:s+=`AM/PM`;break;case`week-of-year`:case`quarter`:console.error(`Excel does not support ODS format token `+a[3]);break;case`fill-character`:a[1]===`/`?(f=i.slice(d,Zn.lastIndex-a[0].length),s+=`"`+f.replace(/"/g,`""`)+`"*`):a[0].charAt(a[0].length-2)!==`/`&&(d=Zn.lastIndex);break;case`scientific-number`:l=q(a[0],!1),s+=`0.`+Bt(`0`,+l[`min-decimal-places`]||+l[`decimal-places`]||2)+Bt(`?`,l[`decimal-places`]-+l[`min-decimal-places`]||0)+`E`+(In(l[`forced-exponent-sign`])?`+`:``)+Bt(`0`,+l[`min-exponent-digits`]||2);break;case`fraction`:l=q(a[0],!1),+l[`min-integer-digits`]?s+=Bt(`0`,+l[`min-integer-digits`]):s+=`#`,s+=` `,s+=Bt(`?`,+l[`min-numerator-digits`]||1),s+=`/`,+l[`denominator-value`]?s+=l[`denominator-value`]:s+=Bt(`?`,+l[`min-denominator-digits`]||1);break;case`currency-symbol`:a[1]===`/`?s+=`"`+i.slice(d,Zn.lastIndex-a[0].length).replace(/"/g,`""`)+`"`:a[0].charAt(a[0].length-2)===`/`?s+=`$`:d=Zn.lastIndex;break;case`text-properties`:switch(l=q(a[0],!1),(l.color||``).toLowerCase().replace(`#`,``)){case`ff0000`:case`red`:s=`[Red]`+s;break}break;case`text-content`:s+=`@`;break;case`map`:l=q(a[0],!1),jn(l.condition)==`value()>=0`?s=r[l[`apply-style-name`]]+`;`+s:console.error(`ODS number format may be incorrect: `+l.condition);break;case`number`:if(a[1]===`/`)break;l=q(a[0],!1),c=``,c+=Bt(`0`,+l[`min-integer-digits`]||1),In(l.grouping)&&(c=ze(Bt(`#`,Math.max(0,4-c.length))+c)),(+l[`min-decimal-places`]||+l[`decimal-places`])&&(c+=`.`),+l[`min-decimal-places`]&&(c+=Bt(`0`,+l[`min-decimal-places`]||1)),l[`decimal-places`]-(+l[`min-decimal-places`]||0)&&(c+=Bt(`0`,l[`decimal-places`]-(+l[`min-decimal-places`]||0))),s+=c;break;case`embedded-text`:a[1]===`/`?u==0?s+=`"`+i.slice(d,Zn.lastIndex-a[0].length).replace(/"/g,`""`)+`"`:s=s.slice(0,u)+`"`+i.slice(d,Zn.lastIndex-a[0].length).replace(/"/g,`""`)+`"`+s.slice(u):a[0].charAt(a[0].length-2)!==`/`&&(d=Zn.lastIndex,u=-+q(a[0],!1).position||0);break}return r}function em(e,t,n){var r=t||{};z!=null&&r.dense==null&&(r.dense=z);var i=Xn(e),a=[],o,s,c,l=``,u=0,d,f,p={},m=[],h={};r.dense&&(h[`!data`]=[]);var g,_,v={value:``},y={},b=``,x=0,S,C=``,w=0,T=[],E=[],D=-1,O=-1,k={s:{r:1e6,c:1e7},e:{r:0,c:0}},A=0,j=n||{},M={},N=[],P={},ee=0,F=0,I=[],te=1,ne=1,L=[],R={Names:[],WBProps:{}},B={},V=[``,``],re=[],H={},U=``,ie=0,ae=!1,oe=!1,W=0;for(Zn.lastIndex=0,i=$t(tn(i,`<!--`,`-->`));g=Zn.exec(i);)switch(g[3]=g[3].replace(/_[\s\S]*$/,``)){case`table`:case`工作表`:g[1]===`/`?(k.e.c>=k.s.c&&k.e.r>=k.s.r?h[`!ref`]=ri(k):h[`!ref`]=`A1:A1`,r.sheetRows>0&&r.sheetRows<=k.e.r&&(h[`!fullref`]=h[`!ref`],k.e.r=r.sheetRows-1,h[`!ref`]=ri(k)),N.length&&(h[`!merges`]=N),I.length&&(h[`!rows`]=I),d.name=d.名称||d.name,typeof JSON<`u`&&JSON.stringify(d),m.push(d.name),p[d.name]=h,oe=!1):g[0].charAt(g[0].length-2)!==`/`&&(d=q(g[0],!1),D=O=-1,k.s.r=k.s.c=1e7,k.e.r=k.e.c=0,h={},r.dense&&(h[`!data`]=[]),N=[],I=[],oe=!0);break;case`table-row-group`:g[1]===`/`?--A:++A;break;case`table-row`:case`行`:if(g[1]===`/`){D+=te,te=1;break}if(f=q(g[0],!1),f.行号?D=f.行号-1:D==-1&&(D=0),te=+f[`number-rows-repeated`]||1,te<10)for(W=0;W<te;++W)A>0&&(I[D+W]={level:A});O=-1;break;case`covered-table-cell`:if(g[1]!==`/`)if(++O,v=q(g[0],!1),ne=parseInt(v[`number-columns-repeated`]||`1`,10)||1,r.sheetStubs){for(;ne-->0;)r.dense?(h[`!data`][D]||(h[`!data`][D]=[]),h[`!data`][D][O]={t:`z`}):h[ti({r:D,c:O})]={t:`z`},++O;--O}else O+=ne-1;b=``,T=[];break;case`table-cell`:case`数据`:if(g[0].charAt(g[0].length-2)===`/`)++O,v=q(g[0],!1),ne=parseInt(v[`number-columns-repeated`]||`1`,10)||1,_={t:`z`,v:null},v.formula&&r.cellFormula!=0&&(_.f=jd(jn(v.formula))),v[`style-name`]&&M[v[`style-name`]]&&(_.z=M[v[`style-name`]]),(v.数据类型||v[`value-type`])==`string`&&(_.t=`s`,_.v=jn(v[`string-value`]||``),r.dense?(h[`!data`][D]||(h[`!data`][D]=[]),h[`!data`][D][O]=_):h[Xr(O)+Kr(D)]=_),O+=ne-1;else if(g[1]!==`/`){++O,b=C=``,x=w=0,T=[],E=[],ne=1;var se=te?D+te-1:D;if(O>k.e.c&&(k.e.c=O),O<k.s.c&&(k.s.c=O),D<k.s.r&&(k.s.r=D),se>k.e.r&&(k.e.r=se),v=q(g[0],!1),y=Dn(g[0],!0),re=[],H={},_={t:v.数据类型||v[`value-type`],v:null},v[`style-name`]&&M[v[`style-name`]]&&(_.z=M[v[`style-name`]]),r.cellFormula)if(v.formula&&=jn(v.formula),v[`number-matrix-columns-spanned`]&&v[`number-matrix-rows-spanned`]&&(ee=parseInt(v[`number-matrix-rows-spanned`],10)||0,F=parseInt(v[`number-matrix-columns-spanned`],10)||0,P={s:{r:D,c:O},e:{r:D+ee-1,c:O+F-1}},_.F=ri(P),L.push([P,_.F])),v.formula)_.f=jd(v.formula);else for(W=0;W<L.length;++W)D>=L[W][0].s.r&&D<=L[W][0].e.r&&O>=L[W][0].s.c&&O<=L[W][0].e.c&&(_.F=L[W][1]);switch((v[`number-columns-spanned`]||v[`number-rows-spanned`])&&(ee=parseInt(v[`number-rows-spanned`]||`1`,10)||1,F=parseInt(v[`number-columns-spanned`]||`1`,10)||1,ee*F>1&&(P={s:{r:D,c:O},e:{r:D+ee-1,c:O+F-1}},N.push(P))),v[`number-columns-repeated`]&&(ne=parseInt(v[`number-columns-repeated`],10)),_.t){case`boolean`:_.t=`b`,_.v=In(v[`boolean-value`])||+v[`boolean-value`]>=1;break;case`float`:_.t=`n`,_.v=parseFloat(v.value),r.cellDates&&_.z&&lt(_.z)&&(_.v=Mt(_.v+(R.WBProps.date1904?1462:0)),_.t=typeof _.v==`number`?`n`:`d`);break;case`percentage`:_.t=`n`,_.v=parseFloat(v.value);break;case`currency`:_.t=`n`,_.v=parseFloat(v.value);break;case`date`:_.t=`d`,_.v=Lt(v[`date-value`],R.WBProps.date1904),r.cellDates||(_.t=`n`,_.v=jt(_.v,R.WBProps.date1904)),_.z||=`m/d/yy`;break;case`time`:_.t=`n`,_.v=Nt(v[`time-value`])/86400,r.cellDates&&(_.v=Mt(_.v),_.t=typeof _.v==`number`?`n`:`d`),_.z||=`HH:MM:SS`;break;case`number`:_.t=`n`,_.v=parseFloat(v.数据数值);break;default:if(_.t===`string`||_.t===`text`||!_.t)_.t=`s`,v[`string-value`]!=null&&(b=jn(v[`string-value`]),T=[]);else throw Error(`Unsupported value type `+_.t)}}else{if(ae=!1,y[`calcext:value-type`]==`error`&&Zi[b]!=null&&(_.t=`e`,_.w=b,_.v=Zi[b]),_.t===`s`&&(_.v=b||``,T.length&&(_.R=T),ae=x==0),B.Target&&(_.l=B),re.length>0&&(_.c=re,re=[]),b&&r.cellText!==!1&&(_.w=b),ae&&(_.t=`z`,delete _.v),(!ae||r.sheetStubs)&&!(r.sheetRows&&r.sheetRows<=D))for(var ce=0;ce<te;++ce){if(ne=parseInt(v[`number-columns-repeated`]||`1`,10),r.dense)for(h[`!data`][D+ce]||(h[`!data`][D+ce]=[]),h[`!data`][D+ce][O]=ce==0?_:zt(_);--ne>0;)h[`!data`][D+ce][O+ne]=zt(_);else for(h[ti({r:D+ce,c:O})]=_;--ne>0;)h[ti({r:D+ce,c:O+ne})]=zt(_);k.e.c<=O&&(k.e.c=O)}ne=parseInt(v[`number-columns-repeated`]||`1`,10),O+=ne-1,ne=0,_={},b=``,T=[]}B={};break;case`document`:case`document-content`:case`电子表格文档`:case`spreadsheet`:case`主体`:case`scripts`:case`styles`:case`font-face-decls`:case`master-styles`:if(g[1]===`/`){if((o=a.pop())[0]!==g[3])throw`Bad state: `+o}else g[0].charAt(g[0].length-2)!==`/`&&a.push([g[3],!0]);break;case`annotation`:if(g[1]===`/`){if((o=a.pop())[0]!==g[3])throw`Bad state: `+o;H.t=b,T.length&&(H.R=T),H.a=U,re.push(H),b=C,x=w,T=E}else if(g[0].charAt(g[0].length-2)!==`/`){a.push([g[3],!1]);var le=q(g[0],!0);le.display&&In(le.display)||(re.hidden=!0),C=b,w=x,E=T,b=``,x=0,T=[]}U=``,ie=0;break;case`creator`:g[1]===`/`?U=i.slice(ie,g.index):ie=g.index+g[0].length;break;case`meta`:case`元数据`:case`settings`:case`config-item-set`:case`config-item-map-indexed`:case`config-item-map-entry`:case`config-item-map-named`:case`shapes`:case`frame`:case`text-box`:case`image`:case`data-pilot-tables`:case`list-style`:case`form`:case`dde-links`:case`event-listeners`:case`chart`:if(g[1]===`/`){if((o=a.pop())[0]!==g[3])throw`Bad state: `+o}else g[0].charAt(g[0].length-2)!==`/`&&a.push([g[3],!1]);b=``,x=0,T=[];break;case`scientific-number`:case`currency-symbol`:case`fill-character`:break;case`text-style`:case`boolean-style`:case`number-style`:case`currency-style`:case`percentage-style`:case`date-style`:case`time-style`:if(g[1]===`/`){var ue=Zn.lastIndex;$p(i.slice(c,Zn.lastIndex),t,j),Zn.lastIndex=ue}else g[0].charAt(g[0].length-2)!==`/`&&(c=Zn.lastIndex-g[0].length);break;case`script`:break;case`libraries`:break;case`automatic-styles`:break;case`default-style`:case`page-layout`:break;case`style`:var de=q(g[0],!1);de.family==`table-cell`&&j[de[`data-style-name`]]&&(M[de.name]=j[de[`data-style-name`]]);break;case`map`:break;case`font-face`:break;case`paragraph-properties`:break;case`table-properties`:break;case`table-column-properties`:break;case`table-row-properties`:break;case`table-cell-properties`:break;case`number`:break;case`fraction`:break;case`day`:case`month`:case`year`:case`era`:case`day-of-week`:case`week-of-year`:case`quarter`:case`hours`:case`minutes`:case`seconds`:case`am-pm`:break;case`boolean`:break;case`text`:if(g[0].slice(-2)===`/>`)break;if(g[1]===`/`)switch(a[a.length-1][0]){case`number-style`:case`date-style`:case`time-style`:l+=i.slice(u,g.index);break}else u=g.index+g[0].length;break;case`named-range`:s=q(g[0],!1),V=Md(s[`cell-range-address`]);var fe={Name:s.name,Ref:V[0]+`!`+V[1]};oe&&(fe.Sheet=m.length),R.Names.push(fe);break;case`text-content`:break;case`text-properties`:break;case`embedded-text`:break;case`body`:case`电子表格`:break;case`forms`:break;case`table-column`:break;case`table-header-rows`:break;case`table-rows`:break;case`table-column-group`:break;case`table-header-columns`:break;case`table-columns`:break;case`null-date`:switch(s=q(g[0],!1),s[`date-value`]){case`1904-01-01`:R.WBProps.date1904=!0;break}break;case`graphic-properties`:break;case`calculation-settings`:break;case`named-expressions`:break;case`label-range`:break;case`label-ranges`:break;case`named-expression`:break;case`sort`:break;case`sort-by`:break;case`sort-groups`:break;case`tab`:break;case`line-break`:break;case`span`:break;case`p`:case`文本串`:if([`master-styles`].indexOf(a[a.length-1][0])>-1)break;if(g[1]===`/`&&(!v||!v[`string-value`])){var pe=Qp(i.slice(x,g.index),S);b=(b.length>0?b+`
`:``)+pe[0]}else g[0].slice(-2)==`/>`?b+=`
`:(S=q(g[0],!1),x=g.index+g[0].length);break;case`s`:break;case`database-range`:if(g[1]===`/`)break;try{V=Md(q(g[0])[`target-range-address`]),p[V[0]][`!autofilter`]={ref:V[1]}}catch{}break;case`date`:break;case`object`:break;case`title`:case`标题`:break;case`desc`:break;case`binary-data`:break;case`table-source`:break;case`scenario`:break;case`iteration`:break;case`content-validations`:break;case`content-validation`:break;case`help-message`:break;case`error-message`:break;case`database-ranges`:break;case`filter`:break;case`filter-and`:break;case`filter-or`:break;case`filter-condition`:break;case`filter-set-item`:break;case`list-level-style-bullet`:break;case`list-level-style-number`:break;case`list-level-properties`:break;case`sender-firstname`:case`sender-lastname`:case`sender-initials`:case`sender-title`:case`sender-position`:case`sender-email`:case`sender-phone-private`:case`sender-fax`:case`sender-company`:case`sender-phone-work`:case`sender-street`:case`sender-city`:case`sender-postal-code`:case`sender-country`:case`sender-state-or-province`:case`author-name`:case`author-initials`:case`chapter`:case`file-name`:case`template-name`:case`sheet-name`:break;case`event-listener`:break;case`initial-creator`:case`creation-date`:case`print-date`:case`generator`:case`document-statistic`:case`user-defined`:case`editing-duration`:case`editing-cycles`:break;case`config-item`:break;case`page-number`:break;case`page-count`:break;case`time`:break;case`cell-range-source`:break;case`detective`:break;case`operation`:break;case`highlighted-range`:break;case`data-pilot-table`:case`source-cell-range`:case`source-service`:case`data-pilot-field`:case`data-pilot-level`:case`data-pilot-subtotals`:case`data-pilot-subtotal`:case`data-pilot-members`:case`data-pilot-member`:case`data-pilot-display-info`:case`data-pilot-sort-info`:case`data-pilot-layout-info`:case`data-pilot-field-reference`:case`data-pilot-groups`:case`data-pilot-group`:case`data-pilot-group-member`:break;case`rect`:break;case`dde-connection-decls`:case`dde-connection-decl`:case`dde-link`:case`dde-source`:break;case`properties`:break;case`property`:break;case`a`:if(g[1]!==`/`){if(B=q(g[0],!1),!B.href)break;B.Target=jn(B.href),delete B.href,B.Target.charAt(0)==`#`&&B.Target.indexOf(`.`)>-1?(V=Md(B.Target.slice(1)),B.Target=`#`+V[0]+`!`+V[1]):B.Target.match(/^\.\.[\\\/]/)&&(B.Target=B.Target.slice(3))}break;case`table-protection`:break;case`data-pilot-grand-total`:break;case`office-document-common-attrs`:break;default:switch(g[2]){case`dc:`:case`calcext:`:case`loext:`:case`ooo:`:case`chartooo:`:case`draw:`:case`style:`:case`chart:`:case`form:`:case`uof:`:case`表:`:case`字:`:break;default:if(r.WTF)throw Error(g)}}var me={Sheets:p,SheetNames:m,Workbook:R};return r.bookSheets&&delete me.Sheets,me}function tm(e,t){t||={},fn(e,`META-INF/manifest.xml`)&&oa(mn(e,`META-INF/manifest.xml`),t);var n=hn(e,`styles.xml`),r=n&&$p(Vn(n),t),i=hn(e,`content.xml`);if(!i)throw Error(`Missing content.xml in ODS / UOF file`);var a=em(Vn(i),t,r);return fn(e,`meta.xml`)&&(a.Props=ca(mn(e,`meta.xml`))),a.bookType=`ods`,a}function nm(e,t){var n=em(e,t);return n.bookType=`fods`,n}var rm=function(){try{return typeof Uint8Array>`u`||Uint8Array.prototype.subarray===void 0?`slice`:typeof Buffer<`u`?Buffer.prototype.subarray===void 0?`slice`:(typeof Buffer.from==`function`?Buffer.from([72,62]):new Buffer([72,62]))instanceof Uint8Array?`subarray`:`slice`:`subarray`}catch{return`slice`}}();function im(e){return new DataView(e.buffer,e.byteOffset,e.byteLength)}function am(e){return typeof TextDecoder<`u`?new TextDecoder().decode(e):Vn(ce(e))}function om(e){for(var t=0,n=0;n<e.length;++n)t+=e[n].length;var r=new Uint8Array(t),i=0;for(n=0;n<e.length;++n){var a=e[n],o=a.length;if(o<250)for(var s=0;s<o;++s)r[i++]=a[s];else r.set(a,i),i+=o}return r}function sm(e){return e-=e>>1&1431655765,e=(e&858993459)+(e>>2&858993459),(e+(e>>4)&252645135)*16843009>>>24}function cm(e,t){for(var n=(e[t+15]&127)<<7|e[t+14]>>1,r=e[t+14]&1,i=t+13;i>=t;--i)r=r*256+e[i];return(e[t+15]&128?-r:r)*10**(n-6176)}function lm(e,t){var n=t.l,r=e[n]&127;varint:if(e[n++]>=128&&(r|=(e[n]&127)<<7,e[n++]<128||(r|=(e[n]&127)<<14,e[n++]<128)||(r|=(e[n]&127)<<21,e[n++]<128)||(r+=(e[n]&127)*2**28,++n,e[n++]<128)||(r+=(e[n]&127)*2**35,++n,e[n++]<128)||(r+=(e[n]&127)*2**42,++n,e[n++]<128)))break varint;return t.l=n,r}function um(e){var t=0,n=e[t]&127;return e[t++]<128||(n|=(e[t]&127)<<7,e[t++]<128)||(n|=(e[t]&127)<<14,e[t++]<128)||(n|=(e[t]&127)<<21,e[t++]<128)||(n|=(e[t]&15)<<28),n}function dm(e){for(var t=[],n={l:0};n.l<e.length;){var r=n.l,i=lm(e,n),a=i&7;i=i/8|0;var o,s=n.l;switch(a){case 0:for(;e[s++]>=128;);o=e[rm](n.l,s),n.l=s;break;case 1:o=e[rm](s,s+8),n.l=s+8;break;case 2:var c=lm(e,n);o=e[rm](n.l,n.l+c),n.l+=c;break;case 5:o=e[rm](s,s+4),n.l=s+4;break;default:throw Error(`PB Type ${a} for Field ${i} at offset ${r}`)}var l={data:o,type:a};t[i]??(t[i]=[]),t[i].push(l)}return t}function fm(e,t){return e?.map(function(e){return t(e.data)})||[]}function pm(e){for(var t=[],n={l:0};n.l<e.length;){var r=lm(e,n),i=dm(e[rm](n.l,n.l+r));n.l+=r;var a={id:um(i[1][0].data),messages:[]};i[2].forEach(function(t){var r=dm(t.data),i=um(r[3][0].data);a.messages.push({meta:r,data:e[rm](n.l,n.l+i)}),n.l+=i}),i[3]?.[0]&&(a.merge=um(i[3][0].data)>>>0>0),t.push(a)}return t}function mm(e,t){if(e!=0)throw Error(`Unexpected Snappy chunk type ${e}`);for(var n={l:0},r=lm(t,n),i=[],a=n.l;a<t.length;){var o=t[a]&3;if(o==0){var s=t[a++]>>2;if(s<60)++s;else{var c=s-59;s=t[a],c>1&&(s|=t[a+1]<<8),c>2&&(s|=t[a+2]<<16),c>3&&(s|=t[a+3]<<24),s>>>=0,s++,a+=c}i.push(t[rm](a,a+s)),a+=s;continue}else{var l=0,u=0;if(o==1?(u=(t[a]>>2&7)+4,l=(t[a++]&224)<<3,l|=t[a++]):(u=(t[a++]>>2)+1,o==2?(l=t[a]|t[a+1]<<8,a+=2):(l=(t[a]|t[a+1]<<8|t[a+2]<<16|t[a+3]<<24)>>>0,a+=4)),l==0)throw Error(`Invalid offset 0`);for(var d=i.length-1,f=l;d>=0&&f>=i[d].length;)f-=i[d].length,--d;if(d<0)if(f==0)f=i[d=0].length;else throw Error(`Invalid offset beyond length`);if(u<f)i.push(i[d][rm](i[d].length-f,i[d].length-f+u));else{for(f>0&&(i.push(i[d][rm](i[d].length-f)),u-=f),++d;u>=i[d].length;)i.push(i[d]),u-=i[d].length,++d;u&&i.push(i[d][rm](0,u))}i.length>25&&(i=[om(i)])}}for(var p=0,m=0;m<i.length;++m)p+=i[m].length;if(p!=r)throw Error(`Unexpected length: ${p} != ${r}`);return i}function hm(e){Array.isArray(e)&&(e=new Uint8Array(e));for(var t=[],n=0;n<e.length;){var r=e[n++],i=e[n]|e[n+1]<<8|e[n+2]<<16;n+=3,t.push.apply(t,mm(r,e[rm](n,n+i))),n+=i}if(n!==e.length)throw Error(`data is not a valid framed stream!`);return t.length==1?t[0]:om(t)}var gm=function(){return{sst:[],rsst:[],ofmt:[],nfmt:[],fmla:[],ferr:[],cmnt:[]}};function _m(e,t,n,r,i){var a=t&255,o=t>>8,s=o>=5?i:r;dur:if(n&(o>4?8:4)&&e.t==`n`&&a==7){var c=s[7]?.[0]?um(s[7][0].data):-1;if(c==-1)break dur;var l=s[15]?.[0]?um(s[15][0].data):-1,u=s[16]?.[0]?um(s[16][0].data):-1,d=s[40]?.[0]?um(s[40][0].data):-1,f=e.v,p=f;autodur:if(d){if(f==0){l=u=2;break autodur}l=f>=604800?1:f>=86400?2:f>=3600?4:f>=60?8:f>=1?16:32,Math.floor(f)==f?f%60?u=16:f%3600?u=8:f%86400?u=4:f%604800&&(u=2):u=32,u<l&&(u=l)}if(l==-1||u==-1)break dur;var m=[],h=[];l==1&&(p=f/604800,u==1?h.push(`d"d"`):(p|=0,f-=604800*p),m.push(p+(c==2?` week`+(p==1?``:`s`):c==1?`w`:``))),l<=2&&u>=2&&(p=f/86400,u>2&&(p|=0,f-=86400*p),h.push(`d"d"`),m.push(p+(c==2?` day`+(p==1?``:`s`):c==1?`d`:``))),l<=4&&u>=4&&(p=f/3600,u>4&&(p|=0,f-=3600*p),h.push((l>=4?`[h]`:`h`)+`"h"`),m.push(p+(c==2?` hour`+(p==1?``:`s`):c==1?`h`:``))),l<=8&&u>=8&&(p=f/60,u>8&&(p|=0,f-=60*p),h.push((l>=8?`[m]`:`m`)+`"m"`),c==0?m.push((l==8&&u==8||p>=10?``:`0`)+p):m.push(p+(c==2?` minute`+(p==1?``:`s`):c==1?`m`:``))),l<=16&&u>=16&&(p=f,u>16&&(p|=0,f-=p),h.push((l>=16?`[s]`:`s`)+`"s"`),c==0?m.push((u==16&&l==16||p>=10?``:`0`)+p):m.push(p+(c==2?` second`+(p==1?``:`s`):c==1?`s`:``))),u>=32&&(p=Math.round(1e3*f),l<32&&h.push(`.000"ms"`),c==0?m.push((p>=100?``:p>=10?`0`:`00`)+p):m.push(p+(c==2?` millisecond`+(p==1?``:`s`):c==1?`ms`:``))),e.w=m.join(c==0?`:`:` `),e.z=h.join(c==0?`":"`:` `),c==0&&(e.w=e.w.replace(/:(\d\d\d)$/,`.$1`))}}function vm(e,t,n,r){var i=im(e),a=i.getUint32(4,!0),o=-1,s=-1,c=-1,l=NaN,u=0,d=new Date(Date.UTC(2001,0,1)),f=n>1?12:8;a&2&&(c=i.getUint32(f,!0),f+=4),f+=sm(a&(n>1?3468:396))*4,a&512&&(o=i.getUint32(f,!0),f+=4),f+=sm(a&(n>1?12288:4096))*4,a&16&&(s=i.getUint32(f,!0),f+=4),a&32&&(l=i.getFloat64(f,!0),f+=8),a&64&&(d.setTime(d.getTime()+(u=i.getFloat64(f,!0))*1e3),f+=8),n>1&&(a=i.getUint32(8,!0)>>>16,a&255&&(c==-1&&(c=i.getUint32(f,!0)),f+=4));var p,m=e[n>=4?1:2];switch(m){case 0:return;case 2:p={t:`n`,v:l};break;case 3:p={t:`s`,v:t.sst[s]};break;case 5:p=r?.cellDates?{t:`d`,v:d}:{t:`n`,v:u/86400+35430,z:G[14]};break;case 6:p={t:`b`,v:l>0};break;case 7:p={t:`n`,v:l};break;case 8:p={t:`e`,v:0};break;case 9:if(o>-1){var h=t.rsst[o];p={t:`s`,v:h.v},h.l&&(p.l={Target:h.l})}else throw Error(`Unsupported cell type ${e[rm](0,4)}`);break;default:throw Error(`Unsupported cell type ${e[rm](0,4)}`)}return c>-1&&_m(p,m|n<<8,a,t.ofmt[c],t.nfmt[c]),m==7&&(p.v/=86400),p}function ym(e,t,n){var r=im(e);r.getUint32(4,!0);var i=r.getUint32(8,!0),a=12,o=-1,s=-1,c=-1,l=NaN,u=NaN,d=0,f=new Date(Date.UTC(2001,0,1));i&1&&(l=cm(e,a),a+=16),i&2&&(u=r.getFloat64(a,!0),a+=8),i&4&&(f.setTime(f.getTime()+(d=r.getFloat64(a,!0))*1e3),a+=8),i&8&&(s=r.getUint32(a,!0),a+=4),i&16&&(o=r.getUint32(a,!0),a+=4),a+=sm(i&480)*4,i&512&&(r.getUint32(a,!0),a+=4),a+=sm(i&1024)*4,i&2048&&(r.getUint32(a,!0),a+=4);var p,m=e[1];switch(m){case 0:p={t:`z`};break;case 2:p={t:`n`,v:l};break;case 3:p={t:`s`,v:t.sst[s]};break;case 5:p=n?.cellDates?{t:`d`,v:f}:{t:`n`,v:d/86400+35430,z:G[14]};break;case 6:p={t:`b`,v:u>0};break;case 7:p={t:`n`,v:u};break;case 8:p={t:`e`,v:0};break;case 9:if(o>-1){var h=t.rsst[o];p={t:`s`,v:h.v},h.l&&(p.l={Target:h.l})}else throw Error(`Unsupported cell type ${e[1]} : ${i&31} : ${e[rm](0,4)}`);break;case 10:p={t:`n`,v:l};break;default:throw Error(`Unsupported cell type ${e[1]} : ${i&31} : ${e[rm](0,4)}`)}if(a+=sm(i&4096)*4,i&516096&&(c==-1&&(c=r.getUint32(a,!0)),a+=4),i&524288){var g=r.getUint32(a,!0);a+=4,t.cmnt[g]&&(p.c=Em(t.cmnt[g]))}return c>-1&&_m(p,m|1280,i>>13,t.ofmt[c],t.nfmt[c]),m==7&&(p.v/=86400),p}function bm(e,t,n){switch(e[0]){case 0:case 1:case 2:case 3:case 4:return vm(e,t,e[0],n);case 5:return ym(e,t,n);default:throw Error(`Unsupported payload version ${e[0]}`)}}function xm(e){return um(dm(e)[1][0].data)}function Sm(e,t){var n=dm(t.data),r=um(n[1][0].data),i=n[3],a=[];return(i||[]).forEach(function(t){var n=dm(t.data);if(n[1]){var i=um(n[1][0].data)>>>0;switch(r){case 1:a[i]=am(n[3][0].data);break;case 8:var o=e[xm(n[9][0].data)][0],s=e[xm(dm(o.data)[1][0].data)][0],c=um(s.meta[1][0].data);if(c!=2001)throw Error(`2000 unexpected reference to ${c}`);var l=dm(s.data),u={v:l[3].map(function(e){return am(e.data)}).join(``)};a[i]=u;sfields:if(l?.[11]?.[0]){var d=dm(l[11][0].data)?.[1];if(!d)break sfields;d.forEach(function(t){var n=dm(t.data);if(n[2]?.[0]){var r=e[xm(n[2]?.[0].data)][0],i=um(r.meta[1][0].data);switch(i){case 2032:var a=dm(r.data);a?.[2]?.[0]&&!u.l&&(u.l=am(a[2][0].data));break;case 2039:break;default:console.log(`unrecognized ObjectAttribute type ${i}`)}}})}break;case 2:a[i]=dm(n[6][0].data);break;case 3:a[i]=dm(n[5][0].data);break;case 10:var f=e[xm(n[10][0].data)][0];a[i]=Tm(e,f.data);break;default:throw r}}}),a}function Cm(e,t){var n=dm(e),r=um(n[1][0].data)>>>0,i=um(n[2][0].data)>>>0,a=n[8]?.[0]?.data&&um(n[8][0].data)>0||!1,o,s;if(n[7]?.[0]?.data&&t!=0)o=n[7]?.[0]?.data,s=n[6]?.[0]?.data;else if(n[4]?.[0]?.data&&t!=1)o=n[4]?.[0]?.data,s=n[3]?.[0]?.data;else throw`NUMBERS Tile missing ${t} cell storage`;for(var c=a?4:1,l=im(o),u=[],d=0;d<o.length/2;++d){var f=l.getUint16(d*2,!0);f<65535&&u.push([d,f])}if(u.length!=i)throw`Expected ${i} cells, found ${u.length}`;var p=[];for(d=0;d<u.length-1;++d)p[u[d][0]]=s[rm](u[d][1]*c,u[d+1][1]*c);return u.length>=1&&(p[u[u.length-1][0]]=s[rm](u[u.length-1][1]*c)),{R:r,cells:p}}function wm(e,t){var n=dm(t.data),r=-1;n?.[7]?.[0]&&(r=um(n[7][0].data)>>>0?1:0);var i=fm(n[5],function(e){return Cm(e,r)});return{nrows:um(n[4][0].data)>>>0,data:i.reduce(function(e,t){return e[t.R]||(e[t.R]=[]),t.cells.forEach(function(n,r){if(e[t.R][r])throw Error(`Duplicate cell r=${t.R} c=${r}`);e[t.R][r]=n}),e},[])}}function Tm(e,t){var n={t:``,a:``},r=dm(t);if(r?.[1]?.[0]?.data&&(n.t=am(r?.[1]?.[0]?.data)||``),r?.[3]?.[0]?.data){var i=e[xm(r?.[3]?.[0]?.data)][0],a=dm(i.data);a[1]?.[0]?.data&&(n.a=am(a[1][0].data))}return r?.[4]&&(n.replies=[],r[4].forEach(function(t){var r=e[xm(t.data)][0];n.replies.push(Tm(e,r.data))})),n}function Em(e){var t=[];return t.push({t:e.t||``,a:e.a,T:e.replies&&e.replies.length>0}),e.replies&&e.replies.forEach(function(e){t.push({t:e.t||``,a:e.a,T:!0})}),t}function Dm(e,t,n,r){var i=dm(t.data),a={s:{r:0,c:0},e:{r:0,c:0}};if(a.e.r=(um(i[6][0].data)>>>0)-1,a.e.r<0)throw Error(`Invalid row varint ${i[6][0].data}`);if(a.e.c=(um(i[7][0].data)>>>0)-1,a.e.c<0)throw Error(`Invalid col varint ${i[7][0].data}`);n[`!ref`]=ri(a);var o=n[`!data`]!=null,s=n,c=dm(i[4][0].data),l=gm();c[4]?.[0]&&(l.sst=Sm(e,e[xm(c[4][0].data)][0])),c[6]?.[0]&&(l.fmla=Sm(e,e[xm(c[6][0].data)][0])),c[11]?.[0]&&(l.ofmt=Sm(e,e[xm(c[11][0].data)][0])),c[12]?.[0]&&(l.ferr=Sm(e,e[xm(c[12][0].data)][0])),c[17]?.[0]&&(l.rsst=Sm(e,e[xm(c[17][0].data)][0])),c[19]?.[0]&&(l.cmnt=Sm(e,e[xm(c[19][0].data)][0])),c[22]?.[0]&&(l.nfmt=Sm(e,e[xm(c[22][0].data)][0]));var u=dm(c[3][0].data),d=0;if(!c[9]?.[0])throw`NUMBERS file missing row tree`;if(dm(c[9][0].data)[1].map(function(e){return dm(e.data)}).forEach(function(t){d=um(t[1][0].data);var i=um(t[2][0].data),a=u[1][i];if(!a)throw`NUMBERS missing tile `+i;var c=e[xm(dm(a.data)[2][0].data)][0],f=um(c.meta[1][0].data);if(f!=6002)throw Error(`6001 unexpected reference to ${f}`);var p=wm(e,c);p.data.forEach(function(e,t){e.forEach(function(e,i){var a=bm(e,l,r);a&&(o?(s[`!data`][d+t]||(s[`!data`][d+t]=[]),s[`!data`][d+t][i]=a):n[Xr(i)+Kr(d+t)]=a)})}),d+=p.nrows}),c[13]?.[0]){var f=e[xm(c[13][0].data)][0],p=um(f.meta[1][0].data);if(p!=6144)throw Error(`Expected merge type 6144, found ${p}`);n[`!merges`]=dm(f.data)?.[1].map(function(e){var t=dm(e.data),n=im(dm(t[1][0].data)[1][0].data),r=im(dm(t[2][0].data)[1][0].data);return{s:{r:n.getUint16(0,!0),c:n.getUint16(2,!0)},e:{r:n.getUint16(0,!0)+r.getUint16(0,!0)-1,c:n.getUint16(2,!0)+r.getUint16(2,!0)-1}}})}if(!n[`!merges`]?.length&&i[47]?.[0]){var m=dm(i[47][0].data);if(m[2]?.[0]){var h=dm(m[2][0].data);h[3]?.[0]&&(n[`!merges`]=fm(h[3],function(e){var t=dm(dm(dm(e)[2][0].data)[1][0].data);if(t[1]?.[0]){var n=dm(t[1][0].data);if(um(n[1][0].data)==67){var r=dm(n[40][0].data);if(!(!r[3]?.[0]||!r[4]?.[0])){var i=dm(r[3][0].data),a=dm(r[4][0].data),o=um(i[1][0].data),s=i[2]?.[0]?um(i[2][0].data):o,c=um(a[1][0].data),l=a[2]?.[0]?um(a[2][0].data):c;return{s:{r:c,c:o},e:{r:l,c:s}}}}}}).filter(function(e){return e!=null}))}}}function Om(e,t,n){var r=dm(t.data),i={"!ref":`A1`};n?.dense&&(i[`!data`]=[]);var a=e[xm(r[2][0].data)],o=um(a[0].meta[1][0].data);if(o!=6001)throw Error(`6000 unexpected reference to ${o}`);return Dm(e,a[0],i,n),i}function km(e,t,n){var r=dm(t.data),i={name:r[1]?.[0]?am(r[1][0].data):``,sheets:[]};return fm(r[2],xm).forEach(function(t){e[t].forEach(function(t){um(t.meta[1][0].data)==6e3&&i.sheets.push(Om(e,t,n))})}),i}function Am(e,t,n){var r=sh();r.Workbook={WBProps:{date1904:!0}};var i=dm(t.data);if(i[2]?.[0])throw Error(`Keynote presentations are not supported`);if(fm(i[1],xm).forEach(function(t){e[t].forEach(function(t){if(um(t.meta[1][0].data)==2){var i=km(e,t,n);i.sheets.forEach(function(e,t){ch(r,e,t==0?i.name:i.name+`_`+t,!0)})}})}),r.SheetNames.length==0)throw Error(`Empty NUMBERS file`);return r.bookType=`numbers`,r}function jm(e,t){var n={},r=[];if(e.FullPaths.forEach(function(e){if(e.match(/\.iwpv2/))throw Error(`Unsupported password protection`)}),e.FileIndex.forEach(function(e){if(e.name.match(/\.iwa$/)&&e.content[0]==0){var t;try{t=hm(e.content)}catch(t){return console.log(`?? `+e.content.length+` `+(t.message||t))}var i;try{i=pm(t)}catch(e){return console.log(`## `+(e.message||e))}i.forEach(function(e){n[e.id]=e.messages,r.push(e.id)})}}),!r.length)throw Error(`File has no messages`);if(((n?.[1])?.[0].meta?.[1])?.[0].data&&um(n[1][0].meta[1][0].data)==1e4)throw Error(`Pages documents are not supported`);var i=(n?.[1]?.[0]?.meta?.[1])?.[0].data&&um(n[1][0].meta[1][0].data)==1&&n[1][0];if(i||r.forEach(function(e){n[e].forEach(function(e){if(um(e.meta[1][0].data)>>>0==1)if(!i)i=e;else throw Error(`Document has multiple roots`)})}),!i)throw Error(`Cannot find Document root`);return Am(n,i,t)}function Mm(e){return function(t){for(var n=0;n!=e.length;++n){var r=e[n];t[r[0]]===void 0&&(t[r[0]]=r[1]),r[2]===`n`&&(t[r[0]]=Number(t[r[0]]))}}}function Nm(e){Mm([[`cellNF`,!1],[`cellHTML`,!0],[`cellFormula`,!0],[`cellStyles`,!1],[`cellText`,!0],[`cellDates`,!1],[`sheetStubs`,!1],[`sheetRows`,0,`n`],[`bookDeps`,!1],[`bookSheets`,!1],[`bookProps`,!1],[`bookFiles`,!1],[`bookVBA`,!1],[`password`,``],[`WTF`,!1]])(e)}function Pm(e){return na.WS.indexOf(e)>-1?`sheet`:na.CS&&e==na.CS?`chart`:na.DS&&e==na.DS?`dialog`:na.MS&&e==na.MS?`macro`:e&&e.length?e:`sheet`}function Fm(e,t){if(!e)return 0;try{e=t.map(function(t){return t.id||=t.strRelID,[t.name,e[`!id`][t.id].Target,Pm(e[`!id`][t.id].Type)]})}catch{return null}return!e||e.length===0?null:e}function Im(e,t,n,r,i,a,o,s){if(!(!e||!e[`!legdrawel`])){var c=hn(n,bn(e[`!legdrawel`].Target,r),!0);c&&xl(Vn(c),e,s||[])}}function Lm(e,t,n,r,i,a,o,s,c,l,u,d){try{a[r]=ia(hn(e,n,!0),t);var f=mn(e,t),p;switch(s){case`sheet`:p=ip(f,t,i,c,a[r],l,u,d);break;case`chart`:if(p=ap(f,t,i,c,a[r],l,u,d),!p||!p[`!drawel`])break;var m=bn(p[`!drawel`].Target,t),h=ra(m),g=bn(bl(hn(e,m,!0),ia(hn(e,h,!0),m)),m),_=ra(g);p=Lf(hn(e,g,!0),g,c,ia(hn(e,_,!0),g),l,p);break;case`macro`:p=op(f,t,i,c,a[r],l,u,d);break;case`dialog`:p=sp(f,t,i,c,a[r],l,u,d);break;default:throw Error(`Unrecognized sheet type `+s)}o[r]=p;var v=[],y=[];a&&a[r]&&Et(a[r]).forEach(function(n){var i=``;if(a[r][n].Type==na.CMNT){if(i=bn(a[r][n].Target,t),v=up(mn(e,i,!0),i,c),!v||!v.length)return;Sl(p,v,!1)}a[r][n].Type==na.TCMNT&&(i=bn(a[r][n].Target,t),y=y.concat(wl(mn(e,i,!0),c)))}),y&&y.length&&Sl(p,y,!0,c.people||[]),Im(p,s,e,t,i,c,l,v)}catch(e){if(c.WTF)throw e}}function Rm(e){return e.charAt(0)==`/`?e.slice(1):e}function zm(e,t){if(gt(),t||={},Nm(t),fn(e,`META-INF/manifest.xml`)||fn(e,`objectdata.xml`))return tm(e,t);if(fn(e,`Index/Document.iwa`)){if(typeof Uint8Array>`u`)throw Error(`NUMBERS file parsing requires Uint8Array support`);if(jm!==void 0){if(e.FileIndex)return jm(e,t);var n=K.utils.cfb_new();return _n(e).forEach(function(t){vn(n,t,gn(e,t))}),jm(n,t)}throw Error(`Unsupported NUMBERS file`)}if(!fn(e,`[Content_Types].xml`)){if(fn(e,`index.xml.gz`))throw Error(`Unsupported NUMBERS 08 file`);if(fn(e,`index.xml`))throw Error(`Unsupported NUMBERS 09 file`);var r=K.find(e,`Index.zip`);if(r)return t=zt(t),delete t.type,typeof r.content==`string`&&(t.type=`binary`),typeof Bun<`u`&&Buffer.isBuffer(r.content)?Ym(new Uint8Array(r.content),t):Ym(r.content,t);throw Error(`Unsupported ZIP file`)}var i=_n(e),a=ta(hn(e,`[Content_Types].xml`)),o=!1,s,c;if(a.workbooks.length===0&&(c=`xl/workbook.xml`,mn(e,c,!0)&&a.workbooks.push(c)),a.workbooks.length===0){if(c=`xl/workbook.bin`,!mn(e,c,!0))throw Error(`Could not find workbook`);a.workbooks.push(c),o=!0}a.workbooks[0].slice(-3)==`bin`&&(o=!0);var l={},u={};if(!t.bookSheets&&!t.bookProps){if(Nd=[],a.sst)try{Nd=lp(mn(e,Rm(a.sst)),a.sst,t)}catch(e){if(t.WTF)throw e}t.cellStyles&&a.themes.length&&(l=tl(hn(e,a.themes[0].replace(/^\//,``),!0)||``,t)),a.style&&(u=cp(mn(e,Rm(a.style)),a.style,l,t))}a.links.map(function(n){try{var r=ia(hn(e,ra(Rm(n))),n);return fp(mn(e,Rm(n)),r,n,t)}catch{}});var d=rp(mn(e,Rm(a.workbooks[0])),a.workbooks[0],t),f={},p=``;a.coreprops.length&&(p=mn(e,Rm(a.coreprops[0]),!0),p&&(f=ca(p)),a.extprops.length!==0&&(p=mn(e,Rm(a.extprops[0]),!0),p&&da(p,f,t)));var m={};(!t.bookSheets||t.bookProps)&&a.custprops.length!==0&&(p=hn(e,Rm(a.custprops[0]),!0),p&&(m=pa(p,t)));var h={};if((t.bookSheets||t.bookProps)&&(d.Sheets?s=d.Sheets.map(function(e){return e.name}):f.Worksheets&&f.SheetNames.length>0&&(s=f.SheetNames),t.bookProps&&(h.Props=f,h.Custprops=m),t.bookSheets&&s!==void 0&&(h.SheetNames=s),t.bookSheets?h.SheetNames:t.bookProps))return h;s={};var g={};t.bookDeps&&a.calcchain&&(g=dp(mn(e,Rm(a.calcchain)),a.calcchain,t));var _=0,v={},y,b,x=d.Sheets;f.Worksheets=x.length,f.SheetNames=[];for(var S=0;S!=x.length;++S)f.SheetNames[S]=x[S].name;var C=o?`bin`:`xml`,w=a.workbooks[0].lastIndexOf(`/`),T=(a.workbooks[0].slice(0,w+1)+`_rels/`+a.workbooks[0].slice(w+1)+`.rels`).replace(/^\//,``);fn(e,T)||(T=`xl/_rels/workbook.`+C+`.rels`);var E=ia(hn(e,T,!0),T.replace(/_rels.*/,`s5s`));(a.metadata||[]).length>=1&&(t.xlmeta=pp(mn(e,Rm(a.metadata[0])),a.metadata[0],t)),(a.people||[]).length>=1&&(t.people=Tl(mn(e,Rm(a.people[0])),t)),E&&=Fm(E,d.Sheets);var D=+!!mn(e,`xl/worksheets/sheet.xml`,!0);wsloop:for(_=0;_!=f.Worksheets;++_){var O=`sheet`;if(E&&E[_]?(y=`xl/`+E[_][1].replace(/[\/]?xl\//,``),fn(e,y)||(y=E[_][1]),fn(e,y)||(y=T.replace(/_rels\/[\S\s]*$/,``)+E[_][1]),O=E[_][2]):(y=`xl/worksheets/sheet`+(_+1-D)+`.`+C,y=y.replace(/sheet0\./,`sheet.`)),b=y.replace(/^(.*)(\/)([^\/]*)$/,`$1/_rels/$3.rels`),t&&t.sheets!=null)switch(typeof t.sheets){case`number`:if(_!=t.sheets)continue wsloop;break;case`string`:if(f.SheetNames[_].toLowerCase()!=t.sheets.toLowerCase())continue wsloop;break;default:if(Array.isArray&&Array.isArray(t.sheets)){for(var k=!1,A=0;A!=t.sheets.length;++A)typeof t.sheets[A]==`number`&&t.sheets[A]==_&&(k=1),typeof t.sheets[A]==`string`&&t.sheets[A].toLowerCase()==f.SheetNames[_].toLowerCase()&&(k=1);if(!k)continue wsloop}}Lm(e,y,b,f.SheetNames[_],_,v,s,O,t,d,l,u)}return h={Directory:a,Workbook:d,Props:f,Custprops:m,Deps:g,Sheets:s,SheetNames:f.SheetNames,Strings:Nd,Styles:u,Themes:l,SSF:zt(G)},t&&t.bookFiles&&(e.files?(h.keys=i,h.files=e.files):(h.keys=[],h.files={},e.FullPaths.forEach(function(t,n){t=t.replace(/^Root Entry[\/]/,``),h.keys.push(t),h.files[t]=e.FileIndex[n]}))),t&&t.bookVBA&&(a.vba.length>0?h.vbaraw=mn(e,Rm(a.vba[0]),!0):a.defaults&&a.defaults.bin===kl&&(h.vbaraw=mn(e,`xl/vbaProject.bin`,!0))),h.bookType=o?`xlsb`:`xlsx`,h}function Bm(e,t){var n=t||{},r=`Workbook`,i=K.find(e,r);try{if(r=`/!DataSpaces/Version`,i=K.find(e,r),!i||!i.content||(Ys(i.content),r=`/!DataSpaces/DataSpaceMap`,i=K.find(e,r),!i||!i.content))throw Error(`ECMA-376 Encrypted file missing `+r);var a=Zs(i.content);if(a.length!==1||a[0].comps.length!==1||a[0].comps[0].t!==0||a[0].name!==`StrongEncryptionDataSpace`||a[0].comps[0].v!==`EncryptedPackage`)throw Error(`ECMA-376 Encrypted file bad `+r);if(r=`/!DataSpaces/DataSpaceInfo/StrongEncryptionDataSpace`,i=K.find(e,r),!i||!i.content)throw Error(`ECMA-376 Encrypted file missing `+r);var o=Qs(i.content);if(o.length!=1||o[0]!=`StrongEncryptionTransform`)throw Error(`ECMA-376 Encrypted file bad `+r);if(r=`/!DataSpaces/TransformInfo/StrongEncryptionTransform/!Primary`,i=K.find(e,r),!i||!i.content)throw Error(`ECMA-376 Encrypted file missing `+r);ec(i.content)}catch{}if(r=`/EncryptionInfo`,i=K.find(e,r),!i||!i.content)throw Error(`ECMA-376 Encrypted file missing `+r);var s=rc(i.content);if(r=`/EncryptedPackage`,i=K.find(e,r),!i||!i.content)throw Error(`ECMA-376 Encrypted file missing `+r);if(s[0]==4&&typeof decrypt_agile<`u`)return decrypt_agile(s[1],i.content,n.password||``,n);if(s[0]==2&&typeof decrypt_std76<`u`)return decrypt_std76(s[1],i.content,n.password||``,n);throw Error(`File is password-protected`)}function Vm(e,t){var n=``;switch((t||{}).type||`base64`){case`buffer`:return[e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[7]];case`base64`:n=H(e.slice(0,12));break;case`binary`:n=e;break;case`array`:return[e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[7]];default:throw Error(`Unrecognized type `+(t&&t.type||`undefined`))}return[n.charCodeAt(0),n.charCodeAt(1),n.charCodeAt(2),n.charCodeAt(3),n.charCodeAt(4),n.charCodeAt(5),n.charCodeAt(6),n.charCodeAt(7)]}function Hm(e,t){return K.find(e,`EncryptedPackage`)?Bm(e,t):Ip(e,t)}function Um(e,t){var n,r=e,i=t||{};return i.type||=U&&Buffer.isBuffer(e)?`buffer`:`base64`,n=yn(r,i),zm(n,i)}function Wm(e,t){var n=0;main:for(;n<e.length;)switch(e.charCodeAt(n)){case 10:case 13:case 32:++n;break;case 60:return Dp(e.slice(n),t);default:break main}return Ns.to_workbook(e,t)}function Gm(e,t){var n=``,r=Vm(e,t);switch(t.type){case`base64`:n=H(e);break;case`binary`:n=e;break;case`buffer`:n=e.toString(`binary`);break;case`array`:n=Rt(e);break;default:throw Error(`Unrecognized type `+t.type)}return r[0]==239&&r[1]==187&&r[2]==191&&(n=Vn(n)),t.type=`binary`,Wm(n,t)}function Km(e,t){var n=e;return t.type==`base64`&&(n=H(n)),typeof ArrayBuffer<`u`&&e instanceof ArrayBuffer&&(n=new Uint8Array(e)),n=O===void 0?U&&Buffer.isBuffer(e)?e.slice(2).toString(`utf16le`):typeof Uint8Array<`u`&&n instanceof Uint8Array?typeof TextDecoder<`u`?new TextDecoder(`utf-16le`).decode(n.slice(2)):I(n.slice(2)):F(n.slice(2)):O.utils.decode(1200,n.slice(2),`str`),t.type=`binary`,Wm(n,t)}function qm(e){return e.match(/[^\x00-\x7F]/)?Hn(e):e}function Jm(e,t,n,r){return r?(n.type=`string`,Ns.to_workbook(e,n)):Ns.to_workbook(t,n)}function Ym(e,t){P();var n=t||{};if(n.codepage&&O===void 0&&console.error(`Codepage tables are not loaded.  Non-ASCII characters may not give expected results`),typeof ArrayBuffer<`u`&&e instanceof ArrayBuffer)return Ym(new Uint8Array(e),(n=zt(n),n.type=`array`,n));if(typeof Int8Array<`u`&&e instanceof Int8Array)return Ym(new Uint8Array(e.buffer,e.byteOffset,e.length),n);typeof Uint8Array<`u`&&e instanceof Uint8Array&&!n.type&&(n.type=typeof Deno<`u`?`buffer`:`array`);var r=e,i=[0,0,0,0],a=!1;if(n.cellStyles&&(n.cellNF=!0,n.sheetStubs=!0),Pd={},n.dateNF&&(Pd.dateNF=n.dateNF),n.type||=U&&Buffer.isBuffer(e)?`buffer`:`base64`,n.type==`file`&&(n.type=U?`buffer`:`binary`,r=Tt(e),typeof Uint8Array<`u`&&!U&&(n.type=`array`)),n.type==`string`&&(a=!0,n.type=`binary`,n.codepage=65001,r=qm(e)),n.type==`array`&&typeof Uint8Array<`u`&&e instanceof Uint8Array&&typeof ArrayBuffer<`u`){var o=new Uint8Array(new ArrayBuffer(3));if(o.foo=`bar`,!o.foo)return n=zt(n),n.type=`array`,Ym(le(r),n)}switch((i=Vm(r,n))[0]){case 208:if(i[1]===207&&i[2]===17&&i[3]===224&&i[4]===161&&i[5]===177&&i[6]===26&&i[7]===225)return Hm(K.read(r,n),n);break;case 9:if(i[1]<=8)return Ip(r,n);break;case 60:return Dp(r,n);case 73:if(i[1]===73&&i[2]===42&&i[3]===0)throw Error(`TIFF Image File is not a spreadsheet`);if(i[1]===68)return Ps(r,n);break;case 84:if(i[1]===65&&i[2]===66&&i[3]===76)return js.to_workbook(r,n);break;case 80:return i[1]===75&&i[2]<9&&i[3]<9?Um(r,n):Jm(e,r,n,a);case 239:return i[3]===60?Dp(r,n):Jm(e,r,n,a);case 255:if(i[1]===254)return Km(r,n);if(i[1]===0&&i[2]===2&&i[3]===0)return Fs.to_workbook(r,n);break;case 0:if(i[1]===0&&(i[2]>=2&&i[3]===0||i[2]===0&&(i[3]===8||i[3]===9)))return Fs.to_workbook(r,n);break;case 3:case 131:case 139:case 140:return ks.to_workbook(r,n);case 123:if(i[1]===92&&i[2]===114&&i[3]===116)return vc(r,n);break;case 10:case 13:case 32:return Gm(r,n);case 137:if(i[1]===80&&i[2]===78&&i[3]===71)throw Error(`PNG Image File is not a spreadsheet`);break;case 8:if(i[1]===231)throw Error(`Unsupported Multiplan 1.x file!`);break;case 12:if(i[1]===236)throw Error(`Unsupported Multiplan 2.x file!`);if(i[1]===237)throw Error(`Unsupported Multiplan 3.x file!`);break}return Os.indexOf(i[0])>-1&&i[2]<=12&&i[3]<=31?ks.to_workbook(r,n):Jm(e,r,n,a)}function Xm(e,t,n,r,i,a,o){var s=Kr(n),c=o.defval,l=o.raw||!Object.prototype.hasOwnProperty.call(o,`raw`),u=!0,d=e[`!data`]!=null,f=i===1?[]:{};if(i!==1)if(Object.defineProperty)try{Object.defineProperty(f,"__rowNum__",{value:n,enumerable:!1})}catch{f.__rowNum__=n}else f.__rowNum__=n;if(!d||e[`!data`][n])for(var p=t.s.c;p<=t.e.c;++p){var m=d?(e[`!data`][n]||[])[p]:e[r[p]+s];if(m==null||m.t===void 0){if(c===void 0)continue;a[p]!=null&&(f[a[p]]=c);continue}var h=m.v;switch(m.t){case`z`:if(h==null)break;continue;case`e`:h=h==0?null:void 0;break;case`s`:case`b`:case`n`:if(!m.z||!lt(m.z)||(h=Mt(h),typeof h==`number`))break;case`d`:o&&(o.UTC||o.raw===!1)||(h=Zt(new Date(h)));break;default:throw Error(`unrecognized type `+m.t)}if(a[p]!=null){if(h==null)if(m.t==`e`&&h===null)f[a[p]]=null;else if(c!==void 0)f[a[p]]=c;else if(l&&h===null)f[a[p]]=null;else continue;else f[a[p]]=(m.t===`n`&&typeof o.rawNumbers==`boolean`?o.rawNumbers:l)?h:si(m,h,o);h!=null&&(u=!1)}}return{row:f,isempty:u}}function Zm(e,t){if(e==null||e[`!ref`]==null)return[];var n={t:`n`,v:0},r=0,i=1,a=[],o=0,s=``,c={s:{r:0,c:0},e:{r:0,c:0}},l=t||{},u=l.range==null?e[`!ref`]:l.range;switch(l.header===1?r=1:l.header===`A`?r=2:Array.isArray(l.header)?r=3:l.header??(r=0),typeof u){case`string`:c=ai(u);break;case`number`:c=ai(e[`!ref`]),c.s.r=u;break;default:c=u}r>0&&(i=0);var d=Kr(c.s.r),f=[],p=[],m=0,h=0,g=e[`!data`]!=null,_=c.s.r,v=0,y={};g&&!e[`!data`][_]&&(e[`!data`][_]=[]);var b=l.skipHidden&&e[`!cols`]||[],x=l.skipHidden&&e[`!rows`]||[];for(v=c.s.c;v<=c.e.c;++v)if(!(b[v]||{}).hidden)switch(f[v]=Xr(v),n=g?e[`!data`][_][v]:e[f[v]+d],r){case 1:a[v]=v-c.s.c;break;case 2:a[v]=f[v];break;case 3:a[v]=l.header[v-c.s.c];break;default:if(n??={w:`__EMPTY`,t:`s`},s=o=si(n,null,l),h=y[o]||0,!h)y[o]=1;else{do s=o+`_`+h++;while(y[s]);y[o]=h,y[s]=1}a[v]=s}for(_=c.s.r+i;_<=c.e.r;++_)if(!(x[_]||{}).hidden){var S=Xm(e,c,_,f,r,a,l);(S.isempty===!1||(r===1?l.blankrows!==!1:l.blankrows))&&(p[m++]=S.row)}return p.length=m,p}var Qm=/"/g;function $m(e,t,n,r,i,a,o,s,c){for(var l=!0,u=[],d=``,f=Kr(n),p=e[`!data`]!=null,m=p&&e[`!data`][n]||[],h=t.s.c;h<=t.e.c;++h)if(r[h]){var g=p?m[h]:e[r[h]+f];if(g==null)d=``;else if(g.v!=null){l=!1,d=``+(c.rawNumbers&&g.t==`n`?g.v:si(g,null,c));for(var _=0,v=0;_!==d.length;++_)if((v=d.charCodeAt(_))===i||v===a||v===34||c.forceQuotes){d=`"`+d.replace(Qm,`""`)+`"`;break}d==`ID`&&s==0&&u.length==0&&(d=`"ID"`)}else g.f!=null&&!g.F?(l=!1,d=`=`+g.f,d.indexOf(`,`)>=0&&(d=`"`+d.replace(Qm,`""`)+`"`)):d=``;u.push(d)}if(c.strip)for(;u[u.length-1]===``;)--u.length;return c.blankrows===!1&&l?null:u.join(o)}function eh(e,t){var n=[],r=t??{};if(e==null||e[`!ref`]==null)return``;for(var i=ai(e[`!ref`]),a=r.FS===void 0?`,`:r.FS,o=a.charCodeAt(0),s=r.RS===void 0?`
`:r.RS,c=s.charCodeAt(0),l=``,u=[],d=r.skipHidden&&e[`!cols`]||[],f=r.skipHidden&&e[`!rows`]||[],p=i.s.c;p<=i.e.c;++p)(d[p]||{}).hidden||(u[p]=Xr(p));for(var m=0,h=i.s.r;h<=i.e.r;++h)(f[h]||{}).hidden||(l=$m(e,i,h,u,o,c,a,m,r),l!=null&&(l||r.blankrows!==!1)&&n.push((m++?s:``)+l));return n.join(``)}function th(e,t){t||={},t.FS=`	`,t.RS=`
`;var n=eh(e,t);return O===void 0||t.type==`string`?n:`ÿþ`+O.utils.encode(1200,n,`str`)}function nh(e,t){var n=``,r,i=``;if(e==null||e[`!ref`]==null)return[];var a=ai(e[`!ref`]),o=``,s=[],c,l=[],u=e[`!data`]!=null;for(c=a.s.c;c<=a.e.c;++c)s[c]=Xr(c);for(var d=a.s.r;d<=a.e.r;++d)for(o=Kr(d),c=a.s.c;c<=a.e.c;++c)if(n=s[c]+o,r=u?(e[`!data`][d]||[])[c]:e[n],i=``,r!==void 0){if(r.F!=null){if(n=r.F,!r.f)continue;i=r.f,n.indexOf(`:`)==-1&&(n=n+`:`+n)}if(r.f!=null)i=r.f;else if(t&&t.values===!1)continue;else if(r.t==`z`)continue;else if(r.t==`n`&&r.v!=null)i=``+r.v;else if(r.t==`b`)i=r.v?`TRUE`:`FALSE`;else if(r.w!==void 0)i=`'`+r.w;else if(r.v===void 0)continue;else i=r.t==`s`?`'`+r.v:``+r.v;l[l.length]=n+`=`+i}return l}function rh(e,t,n){var r=n||{},i=e?e[`!data`]!=null:r.dense;z!=null&&i==null&&(i=z);var a=+!r.skipHeader,o=e||{};!e&&i&&(o[`!data`]=[]);var s=0,c=0;if(o&&r.origin!=null)if(typeof r.origin==`number`)s=r.origin;else{var l=typeof r.origin==`string`?ei(r.origin):r.origin;s=l.r,c=l.c}var u={s:{c:0,r:0},e:{c,r:s+t.length-1+a}};if(o[`!ref`]){var d=ai(o[`!ref`]);u.e.c=Math.max(u.e.c,d.e.c),u.e.r=Math.max(u.e.r,d.e.r),s==-1&&(s=d.e.r+1,u.e.r=s+t.length-1+a)}else s==-1&&(s=0,u.e.r=t.length-1+a);var f=r.header||[],p=0,m=[];t.forEach(function(e,t){i&&!o[`!data`][s+t+a]&&(o[`!data`][s+t+a]=[]),i&&(m=o[`!data`][s+t+a]),Et(e).forEach(function(n){(p=f.indexOf(n))==-1&&(f[p=f.length]=n);var l=e[n],u=`z`,d=``,h=i?``:Xr(c+p)+Kr(s+t+a),g=i?m[c+p]:o[h];l&&typeof l==`object`&&!(l instanceof Date)?i?m[c+p]=l:o[h]=l:(typeof l==`number`?u=`n`:typeof l==`boolean`?u=`b`:typeof l==`string`?u=`s`:l instanceof Date?(u=`d`,r.UTC||(l=Qt(l)),r.cellDates||(u=`n`,l=jt(l)),d=g!=null&&g.z&&lt(g.z)?g.z:r.dateNF||G[14]):l===null&&r.nullError&&(u=`e`,l=0),g?(g.t=u,g.v=l,delete g.w,delete g.R,d&&(g.z=d)):i?m[c+p]=g={t:u,v:l}:o[h]=g={t:u,v:l},d&&(g.z=d))})}),u.e.c=Math.max(u.e.c,c+f.length-1);var h=Kr(s);if(i&&!o[`!data`][s]&&(o[`!data`][s]=[]),a)for(p=0;p<f.length;++p)i?o[`!data`][s][p+c]={t:`s`,v:f[p]}:o[Xr(p+c)+h]={t:`s`,v:f[p]};return o[`!ref`]=ri(u),o}function ih(e,t){return rh(null,e,t)}function ah(e,t,n){if(typeof t==`string`){if(e[`!data`]!=null){var r=ei(t);return e[`!data`][r.r]||(e[`!data`][r.r]=[]),e[`!data`][r.r][r.c]||(e[`!data`][r.r][r.c]={t:`z`})}return e[t]||(e[t]={t:`z`})}return typeof t==`number`?ah(e,Xr(n||0)+Kr(t)):ah(e,ti(t))}function oh(e,t){if(typeof t==`number`){if(t>=0&&e.SheetNames.length>t)return t;throw Error(`Cannot find sheet # `+t)}else if(typeof t==`string`){var n=e.SheetNames.indexOf(t);if(n>-1)return n;throw Error(`Cannot find sheet name |`+t+`|`)}else throw Error(`Cannot find sheet |`+t+`|`)}function sh(e,t){var n={SheetNames:[],Sheets:{}};return e&&ch(n,e,t||`Sheet1`),n}function ch(e,t,n,r){var i=1;if(!n)for(;i<=65535&&e.SheetNames.indexOf(n=`Sheet`+i)!=-1;++i,n=void 0);if(!n||e.SheetNames.length>=65535)throw Error(`Too many worksheets`);if(r&&e.SheetNames.indexOf(n)>=0&&n.length<32){var a=n.match(/\d+$/);i=a&&+a[0]||0;var o=a&&n.slice(0,a.index)||n;for(++i;i<=65535&&e.SheetNames.indexOf(n=o+i)!=-1;++i);}if(Yf(n),e.SheetNames.indexOf(n)>=0)throw Error(`Worksheet with name |`+n+`| already exists!`);return e.SheetNames.push(n),e.Sheets[n]=t,n}function lh(e,t,n){e.Workbook||={},e.Workbook.Sheets||(e.Workbook.Sheets=[]);var r=oh(e,t);switch(e.Workbook.Sheets[r]||(e.Workbook.Sheets[r]={}),n){case 0:case 1:case 2:break;default:throw Error(`Bad sheet visibility setting `+n)}e.Workbook.Sheets[r].Hidden=n}function uh(e,t){return e.z=t,e}function dh(e,t,n){return t?(e.l={Target:t},n&&(e.l.Tooltip=n)):delete e.l,e}function fh(e,t,n){return dh(e,`#`+t,n)}function ph(e,t,n){e.c||=[],e.c.push({t,a:n||`SheetJS`})}function mh(e,t,n,r){for(var i=typeof t==`string`?ai(t):t,a=typeof t==`string`?t:ri(t),o=i.s.r;o<=i.e.r;++o)for(var s=i.s.c;s<=i.e.c;++s){var c=ah(e,o,s);c.t=`n`,c.F=a,delete c.v,o==i.s.r&&s==i.s.c&&(c.f=n,r&&(c.D=!0))}var l=ni(e[`!ref`]);return l.s.r>i.s.r&&(l.s.r=i.s.r),l.s.c>i.s.c&&(l.s.c=i.s.c),l.e.r<i.e.r&&(l.e.r=i.e.r),l.e.c<i.e.c&&(l.e.c=i.e.c),e[`!ref`]=ri(l),e}var hh={encode_col:Xr,encode_row:Kr,encode_cell:ti,encode_range:ri,decode_col:Yr,decode_row:Gr,split_cell:$r,decode_cell:ei,decode_range:ni,format_cell:si,sheet_new:li,sheet_add_aoa:ui,sheet_add_json:rh,sheet_add_dom:qp,aoa_to_sheet:di,json_to_sheet:ih,table_to_sheet:Jp,table_to_book:Yp,sheet_to_csv:eh,sheet_to_txt:th,sheet_to_json:Zm,sheet_to_html:Kp,sheet_to_formulae:nh,sheet_to_row_object_array:Zm,sheet_get_cell:ah,book_new:sh,book_append_sheet:ch,book_set_sheet_visibility:lh,cell_set_number_format:uh,cell_set_hyperlink:dh,cell_set_internal_link:fh,cell_add_comment:ph,sheet_set_array_formula:mh,consts:{SHEET_VISIBLE:0,SHEET_HIDDEN:1,SHEET_VERY_HIDDEN:2}};T.version;var gh;function X(e,t,n){function r(n,r){if(n._zod||Object.defineProperty(n,"_zod",{value:{def:r,constr:o,traits:new Set},enumerable:!1}),n._zod.traits.has(e))return;n._zod.traits.add(e),t(n,r);let i=o.prototype,a=Object.keys(i);for(let e=0;e<a.length;e++){let t=a[e];t in n||(n[t]=i[t].bind(n))}}let i=n?.Parent??Object;class a extends i{}Object.defineProperty(a,"name",{value:e});function o(e){var t;let i=n?.Parent?new a:this;r(i,e),(t=i._zod).deferred??(t.deferred=[]);for(let e of i._zod.deferred)e();return i}return Object.defineProperty(o,"init",{value:r}),Object.defineProperty(o,Symbol.hasInstance,{value:t=>n?.Parent&&t instanceof n.Parent?!0:t?._zod?.traits?.has(e)}),Object.defineProperty(o,"name",{value:e}),o}var _h=class extends Error{constructor(){super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`)}},vh=class extends Error{constructor(e){super(`Encountered unidirectional transform during encode: ${e}`),this.name=`ZodEncodeError`}};(gh=globalThis).__zod_globalConfig??(gh.__zod_globalConfig={});var yh=globalThis.__zod_globalConfig;function bh(e){return e&&Object.assign(yh,e),yh}function xh(e){let t=Object.values(e).filter(e=>typeof e==`number`);return Object.entries(e).filter(([e,n])=>t.indexOf(+e)===-1).map(([e,t])=>t)}function Sh(e,t){return typeof t==`bigint`?t.toString():t}function Ch(e){return{get value(){{let t=e();return Object.defineProperty(this,"value",{value:t}),t}throw Error(`cached value already set`)}}}function wh(e){return e==null}function Th(e){let t=+!!e.startsWith(`^`),n=e.endsWith(`$`)?e.length-1:e.length;return e.slice(t,n)}function Eh(e,t){let n=e/t,r=Math.round(n),i=2**-52*Math.max(Math.abs(n),1);return Math.abs(n-r)<i?0:n-r}var Dh=Symbol(`evaluating`);function Oh(e,t,n){let r;Object.defineProperty(e,t,{get(){if(r!==Dh)return r===void 0&&(r=Dh,r=n()),r},set(n){Object.defineProperty(e,t,{value:n})},configurable:!0})}function kh(e,t,n){Object.defineProperty(e,t,{value:n,writable:!0,enumerable:!0,configurable:!0})}function Ah(...e){let t={};for(let n of e){let e=Object.getOwnPropertyDescriptors(n);Object.assign(t,e)}return Object.defineProperties({},t)}function jh(e){return JSON.stringify(e)}function Mh(e){return e.toLowerCase().trim().replace(/[^\w\s-]/g,``).replace(/[\s_-]+/g,`-`).replace(/^-+|-+$/g,``)}var Nh=`captureStackTrace`in Error?Error.captureStackTrace:(...e)=>{};function Ph(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}var Fh=Ch(()=>{if(yh.jitless||typeof navigator<`u`&&navigator?.userAgent?.includes(`Cloudflare`))return!1;try{return Function(``),!0}catch{return!1}});function Ih(e){if(Ph(e)===!1)return!1;let t=e.constructor;if(t===void 0||typeof t!=`function`)return!0;let n=t.prototype;return!(Ph(n)===!1||Object.prototype.hasOwnProperty.call(n,`isPrototypeOf`)===!1)}function Lh(e){return Ih(e)?{...e}:Array.isArray(e)?[...e]:e instanceof Map?new Map(e):e instanceof Set?new Set(e):e}var Rh=new Set([`string`,`number`,`symbol`]);function zh(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function Bh(e,t,n){let r=new e._zod.constr(t??e._zod.def);return(!t||n?.parent)&&(r._zod.parent=e),r}function Z(e){let t=e;if(!t)return{};if(typeof t==`string`)return{error:()=>t};if(t?.message!==void 0){if(t?.error!==void 0)throw Error("Cannot specify both `message` and `error` params");t.error=t.message}return delete t.message,typeof t.error==`string`?{...t,error:()=>t.error}:t}function Vh(e){return Object.keys(e).filter(t=>e[t]._zod.optin===`optional`&&e[t]._zod.optout===`optional`)}var Hh={safeint:[-(2**53-1),2**53-1],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-34028234663852886e22,34028234663852886e22],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]};function Uh(e,t){let n=e._zod.def,r=n.checks;if(r&&r.length>0)throw Error(`.pick() cannot be used on object schemas containing refinements`);return Bh(e,Ah(e._zod.def,{get shape(){let e={};for(let r in t){if(!(r in n.shape))throw Error(`Unrecognized key: "${r}"`);t[r]&&(e[r]=n.shape[r])}return kh(this,`shape`,e),e},checks:[]}))}function Wh(e,t){let n=e._zod.def,r=n.checks;if(r&&r.length>0)throw Error(`.omit() cannot be used on object schemas containing refinements`);return Bh(e,Ah(e._zod.def,{get shape(){let r={...e._zod.def.shape};for(let e in t){if(!(e in n.shape))throw Error(`Unrecognized key: "${e}"`);t[e]&&delete r[e]}return kh(this,`shape`,r),r},checks:[]}))}function Gh(e,t){if(!Ih(t))throw Error(`Invalid input to extend: expected a plain object`);let n=e._zod.def.checks;if(n&&n.length>0){let n=e._zod.def.shape;for(let e in t)if(Object.getOwnPropertyDescriptor(n,e)!==void 0)throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}return Bh(e,Ah(e._zod.def,{get shape(){let n={...e._zod.def.shape,...t};return kh(this,`shape`,n),n}}))}function Kh(e,t){if(!Ih(t))throw Error(`Invalid input to safeExtend: expected a plain object`);return Bh(e,Ah(e._zod.def,{get shape(){let n={...e._zod.def.shape,...t};return kh(this,`shape`,n),n}}))}function qh(e,t){if(e._zod.def.checks?.length)throw Error(`.merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.`);return Bh(e,Ah(e._zod.def,{get shape(){let n={...e._zod.def.shape,...t._zod.def.shape};return kh(this,`shape`,n),n},get catchall(){return t._zod.def.catchall},checks:t._zod.def.checks??[]}))}function Jh(e,t,n){let r=t._zod.def.checks;if(r&&r.length>0)throw Error(`.partial() cannot be used on object schemas containing refinements`);return Bh(t,Ah(t._zod.def,{get shape(){let r=t._zod.def.shape,i={...r};if(n)for(let t in n){if(!(t in r))throw Error(`Unrecognized key: "${t}"`);n[t]&&(i[t]=e?new e({type:`optional`,innerType:r[t]}):r[t])}else for(let t in r)i[t]=e?new e({type:`optional`,innerType:r[t]}):r[t];return kh(this,`shape`,i),i},checks:[]}))}function Yh(e,t,n){return Bh(t,Ah(t._zod.def,{get shape(){let r=t._zod.def.shape,i={...r};if(n)for(let t in n){if(!(t in i))throw Error(`Unrecognized key: "${t}"`);n[t]&&(i[t]=new e({type:`nonoptional`,innerType:r[t]}))}else for(let t in r)i[t]=new e({type:`nonoptional`,innerType:r[t]});return kh(this,`shape`,i),i}}))}function Xh(e,t=0){if(e.aborted===!0)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue!==!0)return!0;return!1}function Zh(e,t=0){if(e.aborted===!0)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue===!1)return!0;return!1}function Qh(e,t){return t.map(t=>{var n;return(n=t).path??(n.path=[]),t.path.unshift(e),t})}function $h(e){return typeof e==`string`?e:e?.message}function eg(e,t,n){let r=e.message?e.message:$h(e.inst?._zod.def?.error?.(e))??$h(t?.error?.(e))??$h(n.customError?.(e))??$h(n.localeError?.(e))??`Invalid input`,{inst:i,continue:a,input:o,...s}=e;return s.path??=[],s.message=r,t?.reportInput&&(s.input=o),s}function tg(e){return Array.isArray(e)?`array`:typeof e==`string`?`string`:`unknown`}function ng(...e){let[t,n,r]=e;return typeof t==`string`?{message:t,code:`custom`,input:n,inst:r}:{...t}}var rg=(e,t)=>{e.name=`$ZodError`,Object.defineProperty(e,"_zod",{value:e._zod,enumerable:!1}),Object.defineProperty(e,"issues",{value:t,enumerable:!1}),e.message=JSON.stringify(t,Sh,2),Object.defineProperty(e,"toString",{value:()=>e.message,enumerable:!1})},ig=X(`$ZodError`,rg),ag=X(`$ZodError`,rg,{Parent:Error});function og(e,t=e=>e.message){let n={},r=[];for(let i of e.issues)i.path.length>0?(n[i.path[0]]=n[i.path[0]]||[],n[i.path[0]].push(t(i))):r.push(t(i));return{formErrors:r,fieldErrors:n}}function sg(e,t=e=>e.message){let n={_errors:[]},r=(e,i=[])=>{for(let a of e.issues)if(a.code===`invalid_union`&&a.errors.length)a.errors.map(e=>r({issues:e},[...i,...a.path]));else if(a.code===`invalid_key`)r({issues:a.issues},[...i,...a.path]);else if(a.code===`invalid_element`)r({issues:a.issues},[...i,...a.path]);else{let e=[...i,...a.path];if(e.length===0)n._errors.push(t(a));else{let r=n,i=0;for(;i<e.length;){let n=e[i];i===e.length-1?(r[n]=r[n]||{_errors:[]},r[n]._errors.push(t(a))):r[n]=r[n]||{_errors:[]},r=r[n],i++}}}};return r(e),n}var cg=e=>(t,n,r,i)=>{let a=r?{...r,async:!1}:{async:!1},o=t._zod.run({value:n,issues:[]},a);if(o instanceof Promise)throw new _h;if(o.issues.length){let t=new((i?.Err)??e)(o.issues.map(e=>eg(e,a,bh())));throw Nh(t,i?.callee),t}return o.value},lg=e=>async(t,n,r,i)=>{let a=r?{...r,async:!0}:{async:!0},o=t._zod.run({value:n,issues:[]},a);if(o instanceof Promise&&(o=await o),o.issues.length){let t=new((i?.Err)??e)(o.issues.map(e=>eg(e,a,bh())));throw Nh(t,i?.callee),t}return o.value},ug=e=>(t,n,r)=>{let i=r?{...r,async:!1}:{async:!1},a=t._zod.run({value:n,issues:[]},i);if(a instanceof Promise)throw new _h;return a.issues.length?{success:!1,error:new(e??ig)(a.issues.map(e=>eg(e,i,bh())))}:{success:!0,data:a.value}},dg=ug(ag),fg=e=>async(t,n,r)=>{let i=r?{...r,async:!0}:{async:!0},a=t._zod.run({value:n,issues:[]},i);return a instanceof Promise&&(a=await a),a.issues.length?{success:!1,error:new e(a.issues.map(e=>eg(e,i,bh())))}:{success:!0,data:a.value}},pg=fg(ag),mg=e=>(t,n,r)=>{let i=r?{...r,direction:`backward`}:{direction:`backward`};return cg(e)(t,n,i)},hg=e=>(t,n,r)=>cg(e)(t,n,r),gg=e=>async(t,n,r)=>{let i=r?{...r,direction:`backward`}:{direction:`backward`};return lg(e)(t,n,i)},_g=e=>async(t,n,r)=>lg(e)(t,n,r),vg=e=>(t,n,r)=>{let i=r?{...r,direction:`backward`}:{direction:`backward`};return ug(e)(t,n,i)},yg=e=>(t,n,r)=>ug(e)(t,n,r),bg=e=>async(t,n,r)=>{let i=r?{...r,direction:`backward`}:{direction:`backward`};return fg(e)(t,n,i)},xg=e=>async(t,n,r)=>fg(e)(t,n,r),Sg=/^[cC][0-9a-z]{6,}$/,Cg=/^[0-9a-z]+$/,wg=/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,Tg=/^[0-9a-vA-V]{20}$/,Eg=/^[A-Za-z0-9]{27}$/,Dg=/^[a-zA-Z0-9_-]{21}$/,Og=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,kg=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,Ag=e=>e?RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`):/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,jg=/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,Mg=`^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;function Ng(){return new RegExp(Mg,`u`)}var Pg=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,Fg=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,Ig=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,Lg=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,Rg=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,zg=/^[A-Za-z0-9_-]*$/,Bg=/^https?$/,Vg=/^\+[1-9]\d{6,14}$/,Hg=`(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`,Ug=RegExp(`^${Hg}$`);function Wg(e){let t=`(?:[01]\\d|2[0-3]):[0-5]\\d`;return typeof e.precision==`number`?e.precision===-1?`${t}`:e.precision===0?`${t}:[0-5]\\d`:`${t}:[0-5]\\d\\.\\d{${e.precision}}`:`${t}(?::[0-5]\\d(?:\\.\\d+)?)?`}function Gg(e){return RegExp(`^${Wg(e)}$`)}function Kg(e){let t=Wg({precision:e.precision}),n=[`Z`];e.local&&n.push(``),e.offset&&n.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);let r=`${t}(?:${n.join(`|`)})`;return RegExp(`^${Hg}T(?:${r})$`)}var qg=e=>{let t=e?`[\\s\\S]{${e?.minimum??0},${e?.maximum??``}}`:`[\\s\\S]*`;return RegExp(`^${t}$`)},Jg=/^-?\d+$/,Yg=/^-?\d+(?:\.\d+)?$/,Xg=/^(?:true|false)$/i,Zg=/^[^A-Z]*$/,Qg=/^[^a-z]*$/,$g=X(`$ZodCheck`,(e,t)=>{var n;e._zod??={},e._zod.def=t,(n=e._zod).onattach??(n.onattach=[])}),e_={number:`number`,bigint:`bigint`,object:`date`},t_=X(`$ZodCheckLessThan`,(e,t)=>{$g.init(e,t);let n=e_[typeof t.value];e._zod.onattach.push(e=>{let n=e._zod.bag,r=(t.inclusive?n.maximum:n.exclusiveMaximum)??1/0;t.value<r&&(t.inclusive?n.maximum=t.value:n.exclusiveMaximum=t.value)}),e._zod.check=r=>{(t.inclusive?r.value<=t.value:r.value<t.value)||r.issues.push({origin:n,code:`too_big`,maximum:typeof t.value==`object`?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),n_=X(`$ZodCheckGreaterThan`,(e,t)=>{$g.init(e,t);let n=e_[typeof t.value];e._zod.onattach.push(e=>{let n=e._zod.bag,r=(t.inclusive?n.minimum:n.exclusiveMinimum)??-1/0;t.value>r&&(t.inclusive?n.minimum=t.value:n.exclusiveMinimum=t.value)}),e._zod.check=r=>{(t.inclusive?r.value>=t.value:r.value>t.value)||r.issues.push({origin:n,code:`too_small`,minimum:typeof t.value==`object`?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),r_=X(`$ZodCheckMultipleOf`,(e,t)=>{$g.init(e,t),e._zod.onattach.push(e=>{var n;(n=e._zod.bag).multipleOf??(n.multipleOf=t.value)}),e._zod.check=n=>{if(typeof n.value!=typeof t.value)throw Error(`Cannot mix number and bigint in multiple_of check.`);(typeof n.value==`bigint`?n.value%t.value===BigInt(0):Eh(n.value,t.value)===0)||n.issues.push({origin:typeof n.value,code:`not_multiple_of`,divisor:t.value,input:n.value,inst:e,continue:!t.abort})}}),i_=X(`$ZodCheckNumberFormat`,(e,t)=>{$g.init(e,t),t.format=t.format||`float64`;let n=t.format?.includes(`int`),r=n?`int`:`number`,[i,a]=Hh[t.format];e._zod.onattach.push(e=>{let r=e._zod.bag;r.format=t.format,r.minimum=i,r.maximum=a,n&&(r.pattern=Jg)}),e._zod.check=o=>{let s=o.value;if(n){if(!Number.isInteger(s)){o.issues.push({expected:r,format:t.format,code:`invalid_type`,continue:!1,input:s,inst:e});return}if(!Number.isSafeInteger(s)){s>0?o.issues.push({input:s,code:`too_big`,maximum:2**53-1,note:`Integers must be within the safe integer range.`,inst:e,origin:r,inclusive:!0,continue:!t.abort}):o.issues.push({input:s,code:`too_small`,minimum:-(2**53-1),note:`Integers must be within the safe integer range.`,inst:e,origin:r,inclusive:!0,continue:!t.abort});return}}s<i&&o.issues.push({origin:`number`,input:s,code:`too_small`,minimum:i,inclusive:!0,inst:e,continue:!t.abort}),s>a&&o.issues.push({origin:`number`,input:s,code:`too_big`,maximum:a,inclusive:!0,inst:e,continue:!t.abort})}}),a_=X(`$ZodCheckMaxLength`,(e,t)=>{var n;$g.init(e,t),(n=e._zod.def).when??(n.when=e=>{let t=e.value;return!wh(t)&&t.length!==void 0}),e._zod.onattach.push(e=>{let n=e._zod.bag.maximum??1/0;t.maximum<n&&(e._zod.bag.maximum=t.maximum)}),e._zod.check=n=>{let r=n.value;if(r.length<=t.maximum)return;let i=tg(r);n.issues.push({origin:i,code:`too_big`,maximum:t.maximum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),o_=X(`$ZodCheckMinLength`,(e,t)=>{var n;$g.init(e,t),(n=e._zod.def).when??(n.when=e=>{let t=e.value;return!wh(t)&&t.length!==void 0}),e._zod.onattach.push(e=>{let n=e._zod.bag.minimum??-1/0;t.minimum>n&&(e._zod.bag.minimum=t.minimum)}),e._zod.check=n=>{let r=n.value;if(r.length>=t.minimum)return;let i=tg(r);n.issues.push({origin:i,code:`too_small`,minimum:t.minimum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),s_=X(`$ZodCheckLengthEquals`,(e,t)=>{var n;$g.init(e,t),(n=e._zod.def).when??(n.when=e=>{let t=e.value;return!wh(t)&&t.length!==void 0}),e._zod.onattach.push(e=>{let n=e._zod.bag;n.minimum=t.length,n.maximum=t.length,n.length=t.length}),e._zod.check=n=>{let r=n.value,i=r.length;if(i===t.length)return;let a=tg(r),o=i>t.length;n.issues.push({origin:a,...o?{code:`too_big`,maximum:t.length}:{code:`too_small`,minimum:t.length},inclusive:!0,exact:!0,input:n.value,inst:e,continue:!t.abort})}}),c_=X(`$ZodCheckStringFormat`,(e,t)=>{var n,r;$g.init(e,t),e._zod.onattach.push(e=>{let n=e._zod.bag;n.format=t.format,t.pattern&&(n.patterns??=new Set,n.patterns.add(t.pattern))}),t.pattern?(n=e._zod).check??(n.check=n=>{t.pattern.lastIndex=0,!t.pattern.test(n.value)&&n.issues.push({origin:`string`,code:`invalid_format`,format:t.format,input:n.value,...t.pattern?{pattern:t.pattern.toString()}:{},inst:e,continue:!t.abort})}):(r=e._zod).check??(r.check=()=>{})}),l_=X(`$ZodCheckRegex`,(e,t)=>{c_.init(e,t),e._zod.check=n=>{t.pattern.lastIndex=0,!t.pattern.test(n.value)&&n.issues.push({origin:`string`,code:`invalid_format`,format:`regex`,input:n.value,pattern:t.pattern.toString(),inst:e,continue:!t.abort})}}),u_=X(`$ZodCheckLowerCase`,(e,t)=>{t.pattern??=Zg,c_.init(e,t)}),d_=X(`$ZodCheckUpperCase`,(e,t)=>{t.pattern??=Qg,c_.init(e,t)}),f_=X(`$ZodCheckIncludes`,(e,t)=>{$g.init(e,t);let n=zh(t.includes),r=new RegExp(typeof t.position==`number`?`^.{${t.position}}${n}`:n);t.pattern=r,e._zod.onattach.push(e=>{let t=e._zod.bag;t.patterns??=new Set,t.patterns.add(r)}),e._zod.check=n=>{n.value.includes(t.includes,t.position)||n.issues.push({origin:`string`,code:`invalid_format`,format:`includes`,includes:t.includes,input:n.value,inst:e,continue:!t.abort})}}),p_=X(`$ZodCheckStartsWith`,(e,t)=>{$g.init(e,t);let n=RegExp(`^${zh(t.prefix)}.*`);t.pattern??=n,e._zod.onattach.push(e=>{let t=e._zod.bag;t.patterns??=new Set,t.patterns.add(n)}),e._zod.check=n=>{n.value.startsWith(t.prefix)||n.issues.push({origin:`string`,code:`invalid_format`,format:`starts_with`,prefix:t.prefix,input:n.value,inst:e,continue:!t.abort})}}),m_=X(`$ZodCheckEndsWith`,(e,t)=>{$g.init(e,t);let n=RegExp(`.*${zh(t.suffix)}$`);t.pattern??=n,e._zod.onattach.push(e=>{let t=e._zod.bag;t.patterns??=new Set,t.patterns.add(n)}),e._zod.check=n=>{n.value.endsWith(t.suffix)||n.issues.push({origin:`string`,code:`invalid_format`,format:`ends_with`,suffix:t.suffix,input:n.value,inst:e,continue:!t.abort})}}),h_=X(`$ZodCheckOverwrite`,(e,t)=>{$g.init(e,t),e._zod.check=e=>{e.value=t.tx(e.value)}}),g_=class{constructor(e=[]){this.content=[],this.indent=0,this&&(this.args=e)}indented(e){this.indent+=1,e(this),--this.indent}write(e){if(typeof e==`function`){e(this,{execution:`sync`}),e(this,{execution:`async`});return}let t=e.split(`
`).filter(e=>e),n=Math.min(...t.map(e=>e.length-e.trimStart().length)),r=t.map(e=>e.slice(n)).map(e=>` `.repeat(this.indent*2)+e);for(let e of r)this.content.push(e)}compile(){let e=Function,t=this?.args,n=[...(this?.content??[``]).map(e=>`  ${e}`)];return new e(...t,n.join(`
`))}},__={major:4,minor:4,patch:3},v_=X(`$ZodType`,(e,t)=>{var n;e??={},e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=__;let r=[...e._zod.def.checks??[]];e._zod.traits.has(`$ZodCheck`)&&r.unshift(e);for(let t of r)for(let n of t._zod.onattach)n(e);if(r.length===0)(n=e._zod).deferred??(n.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse});else{let t=(e,t,n)=>{let r=Xh(e),i;for(let a of t){if(a._zod.def.when){if(Zh(e)||!a._zod.def.when(e))continue}else if(r)continue;let t=e.issues.length,o=a._zod.check(e);if(o instanceof Promise&&n?.async===!1)throw new _h;if(i||o instanceof Promise)i=(i??Promise.resolve()).then(async()=>{await o,e.issues.length!==t&&(r||=Xh(e,t))});else{if(e.issues.length===t)continue;r||=Xh(e,t)}}return i?i.then(()=>e):e},n=(n,i,a)=>{if(Xh(n))return n.aborted=!0,n;let o=t(i,r,a);if(o instanceof Promise){if(a.async===!1)throw new _h;return o.then(t=>e._zod.parse(t,a))}return e._zod.parse(o,a)};e._zod.run=(i,a)=>{if(a.skipChecks)return e._zod.parse(i,a);if(a.direction===`backward`){let t=e._zod.parse({value:i.value,issues:[]},{...a,skipChecks:!0});return t instanceof Promise?t.then(e=>n(e,i,a)):n(t,i,a)}let o=e._zod.parse(i,a);if(o instanceof Promise){if(a.async===!1)throw new _h;return o.then(e=>t(e,r,a))}return t(o,r,a)}}Oh(e,`~standard`,()=>({validate:t=>{try{let n=dg(e,t);return n.success?{value:n.data}:{issues:n.error?.issues}}catch{return pg(e,t).then(e=>e.success?{value:e.data}:{issues:e.error?.issues})}},vendor:`zod`,version:1}))}),y_=X(`$ZodString`,(e,t)=>{v_.init(e,t),e._zod.pattern=[...e?._zod.bag?.patterns??[]].pop()??qg(e._zod.bag),e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=String(n.value)}catch{}return typeof n.value==`string`||n.issues.push({expected:`string`,code:`invalid_type`,input:n.value,inst:e}),n}}),b_=X(`$ZodStringFormat`,(e,t)=>{c_.init(e,t),y_.init(e,t)}),x_=X(`$ZodGUID`,(e,t)=>{t.pattern??=kg,b_.init(e,t)}),S_=X(`$ZodUUID`,(e,t)=>{if(t.version){let e={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[t.version];if(e===void 0)throw Error(`Invalid UUID version: "${t.version}"`);t.pattern??=Ag(e)}else t.pattern??=Ag();b_.init(e,t)}),C_=X(`$ZodEmail`,(e,t)=>{t.pattern??=jg,b_.init(e,t)}),w_=X(`$ZodURL`,(e,t)=>{b_.init(e,t),e._zod.check=n=>{try{let r=n.value.trim();if(!t.normalize&&t.protocol?.source===Bg.source&&!/^https?:\/\//i.test(r)){n.issues.push({code:`invalid_format`,format:`url`,note:`Invalid URL format`,input:n.value,inst:e,continue:!t.abort});return}let i=new URL(r);t.hostname&&(t.hostname.lastIndex=0,t.hostname.test(i.hostname)||n.issues.push({code:`invalid_format`,format:`url`,note:`Invalid hostname`,pattern:t.hostname.source,input:n.value,inst:e,continue:!t.abort})),t.protocol&&(t.protocol.lastIndex=0,t.protocol.test(i.protocol.endsWith(`:`)?i.protocol.slice(0,-1):i.protocol)||n.issues.push({code:`invalid_format`,format:`url`,note:`Invalid protocol`,pattern:t.protocol.source,input:n.value,inst:e,continue:!t.abort})),t.normalize?n.value=i.href:n.value=r;return}catch{n.issues.push({code:`invalid_format`,format:`url`,input:n.value,inst:e,continue:!t.abort})}}}),T_=X(`$ZodEmoji`,(e,t)=>{t.pattern??=Ng(),b_.init(e,t)}),E_=X(`$ZodNanoID`,(e,t)=>{t.pattern??=Dg,b_.init(e,t)}),D_=X(`$ZodCUID`,(e,t)=>{t.pattern??=Sg,b_.init(e,t)}),O_=X(`$ZodCUID2`,(e,t)=>{t.pattern??=Cg,b_.init(e,t)}),k_=X(`$ZodULID`,(e,t)=>{t.pattern??=wg,b_.init(e,t)}),A_=X(`$ZodXID`,(e,t)=>{t.pattern??=Tg,b_.init(e,t)}),j_=X(`$ZodKSUID`,(e,t)=>{t.pattern??=Eg,b_.init(e,t)}),M_=X(`$ZodISODateTime`,(e,t)=>{t.pattern??=Kg(t),b_.init(e,t)}),N_=X(`$ZodISODate`,(e,t)=>{t.pattern??=Ug,b_.init(e,t)}),P_=X(`$ZodISOTime`,(e,t)=>{t.pattern??=Gg(t),b_.init(e,t)}),F_=X(`$ZodISODuration`,(e,t)=>{t.pattern??=Og,b_.init(e,t)}),I_=X(`$ZodIPv4`,(e,t)=>{t.pattern??=Pg,b_.init(e,t),e._zod.bag.format=`ipv4`}),L_=X(`$ZodIPv6`,(e,t)=>{t.pattern??=Fg,b_.init(e,t),e._zod.bag.format=`ipv6`,e._zod.check=n=>{try{new URL(`http://[${n.value}]`)}catch{n.issues.push({code:`invalid_format`,format:`ipv6`,input:n.value,inst:e,continue:!t.abort})}}}),R_=X(`$ZodCIDRv4`,(e,t)=>{t.pattern??=Ig,b_.init(e,t)}),z_=X(`$ZodCIDRv6`,(e,t)=>{t.pattern??=Lg,b_.init(e,t),e._zod.check=n=>{let r=n.value.split(`/`);try{if(r.length!==2)throw Error();let[e,t]=r;if(!t)throw Error();let n=Number(t);if(`${n}`!==t||n<0||n>128)throw Error();new URL(`http://[${e}]`)}catch{n.issues.push({code:`invalid_format`,format:`cidrv6`,input:n.value,inst:e,continue:!t.abort})}}});function B_(e){if(e===``)return!0;if(/\s/.test(e)||e.length%4!=0)return!1;try{return atob(e),!0}catch{return!1}}var V_=X(`$ZodBase64`,(e,t)=>{t.pattern??=Rg,b_.init(e,t),e._zod.bag.contentEncoding=`base64`,e._zod.check=n=>{B_(n.value)||n.issues.push({code:`invalid_format`,format:`base64`,input:n.value,inst:e,continue:!t.abort})}});function H_(e){if(!zg.test(e))return!1;let t=e.replace(/[-_]/g,e=>e===`-`?`+`:`/`);return B_(t.padEnd(Math.ceil(t.length/4)*4,`=`))}var U_=X(`$ZodBase64URL`,(e,t)=>{t.pattern??=zg,b_.init(e,t),e._zod.bag.contentEncoding=`base64url`,e._zod.check=n=>{H_(n.value)||n.issues.push({code:`invalid_format`,format:`base64url`,input:n.value,inst:e,continue:!t.abort})}}),W_=X(`$ZodE164`,(e,t)=>{t.pattern??=Vg,b_.init(e,t)});function G_(e,t=null){try{let n=e.split(`.`);if(n.length!==3)return!1;let[r]=n;if(!r)return!1;let i=JSON.parse(atob(r));return!(`typ`in i&&i?.typ!==`JWT`||!i.alg||t&&(!(`alg`in i)||i.alg!==t))}catch{return!1}}var K_=X(`$ZodJWT`,(e,t)=>{b_.init(e,t),e._zod.check=n=>{G_(n.value,t.alg)||n.issues.push({code:`invalid_format`,format:`jwt`,input:n.value,inst:e,continue:!t.abort})}}),q_=X(`$ZodNumber`,(e,t)=>{v_.init(e,t),e._zod.pattern=e._zod.bag.pattern??Yg,e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=Number(n.value)}catch{}let i=n.value;if(typeof i==`number`&&!Number.isNaN(i)&&Number.isFinite(i))return n;let a=typeof i==`number`?Number.isNaN(i)?`NaN`:Number.isFinite(i)?void 0:`Infinity`:void 0;return n.issues.push({expected:`number`,code:`invalid_type`,input:i,inst:e,...a?{received:a}:{}}),n}}),J_=X(`$ZodNumberFormat`,(e,t)=>{i_.init(e,t),q_.init(e,t)}),Y_=X(`$ZodBoolean`,(e,t)=>{v_.init(e,t),e._zod.pattern=Xg,e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=!!n.value}catch{}let i=n.value;return typeof i==`boolean`||n.issues.push({expected:`boolean`,code:`invalid_type`,input:i,inst:e}),n}}),X_=X(`$ZodUnknown`,(e,t)=>{v_.init(e,t),e._zod.parse=e=>e}),Z_=X(`$ZodNever`,(e,t)=>{v_.init(e,t),e._zod.parse=(t,n)=>(t.issues.push({expected:`never`,code:`invalid_type`,input:t.value,inst:e}),t)});function Q_(e,t,n){e.issues.length&&t.issues.push(...Qh(n,e.issues)),t.value[n]=e.value}var $_=X(`$ZodArray`,(e,t)=>{v_.init(e,t),e._zod.parse=(n,r)=>{let i=n.value;if(!Array.isArray(i))return n.issues.push({expected:`array`,code:`invalid_type`,input:i,inst:e}),n;n.value=Array(i.length);let a=[];for(let e=0;e<i.length;e++){let o=i[e],s=t.element._zod.run({value:o,issues:[]},r);s instanceof Promise?a.push(s.then(t=>Q_(t,n,e))):Q_(s,n,e)}return a.length?Promise.all(a).then(()=>n):n}});function ev(e,t,n,r,i,a){let o=n in r;if(e.issues.length){if(i&&a&&!o)return;t.issues.push(...Qh(n,e.issues))}if(!o&&!i){e.issues.length||t.issues.push({code:`invalid_type`,expected:`nonoptional`,input:void 0,path:[n]});return}e.value===void 0?o&&(t.value[n]=void 0):t.value[n]=e.value}function tv(e){let t=Object.keys(e.shape);for(let n of t)if(!e.shape?.[n]?._zod?.traits?.has(`$ZodType`))throw Error(`Invalid element at key "${n}": expected a Zod schema`);let n=Vh(e.shape);return{...e,keys:t,keySet:new Set(t),numKeys:t.length,optionalKeys:new Set(n)}}function nv(e,t,n,r,i,a){let o=[],s=i.keySet,c=i.catchall._zod,l=c.def.type,u=c.optin===`optional`,d=c.optout===`optional`;for(let i in t){if(i===`__proto__`||s.has(i))continue;if(l===`never`){o.push(i);continue}let a=c.run({value:t[i],issues:[]},r);a instanceof Promise?e.push(a.then(e=>ev(e,n,i,t,u,d))):ev(a,n,i,t,u,d)}return o.length&&n.issues.push({code:`unrecognized_keys`,keys:o,input:t,inst:a}),e.length?Promise.all(e).then(()=>n):n}var rv=X(`$ZodObject`,(e,t)=>{if(v_.init(e,t),!Object.getOwnPropertyDescriptor(t,`shape`)?.get){let e=t.shape;Object.defineProperty(t,"shape",{get:()=>{let n={...e};return Object.defineProperty(t,"shape",{value:n}),n}})}let n=Ch(()=>tv(t));Oh(e._zod,`propValues`,()=>{let e=t.shape,n={};for(let t in e){let r=e[t]._zod;if(r.values){n[t]??(n[t]=new Set);for(let e of r.values)n[t].add(e)}}return n});let r=Ph,i=t.catchall,a;e._zod.parse=(t,o)=>{a??=n.value;let s=t.value;if(!r(s))return t.issues.push({expected:`object`,code:`invalid_type`,input:s,inst:e}),t;t.value={};let c=[],l=a.shape;for(let e of a.keys){let n=l[e],r=n._zod.optin===`optional`,i=n._zod.optout===`optional`,a=n._zod.run({value:s[e],issues:[]},o);a instanceof Promise?c.push(a.then(n=>ev(n,t,e,s,r,i))):ev(a,t,e,s,r,i)}return i?nv(c,s,t,o,n.value,e):c.length?Promise.all(c).then(()=>t):t}}),iv=X(`$ZodObjectJIT`,(e,t)=>{rv.init(e,t);let n=e._zod.parse,r=Ch(()=>tv(t)),i=e=>{let t=new g_([`shape`,`payload`,`ctx`]),n=r.value,i=e=>{let t=jh(e);return`shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`};t.write(`const input = payload.value;`);let a=Object.create(null),o=0;for(let e of n.keys)a[e]=`key_${o++}`;t.write(`const newResult = {};`);for(let r of n.keys){let n=a[r],o=jh(r),s=e[r],c=s?._zod?.optin===`optional`,l=s?._zod?.optout===`optional`;t.write(`const ${n} = ${i(r)};`),c&&l?t.write(`
        if (${n}.issues.length) {
          if (${o} in input) {
            payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${o}, ...iss.path] : [${o}]
            })));
          }
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `):c?t.write(`
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `):t.write(`
        const ${n}_present = ${o} in input;
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        if (!${n}_present && !${n}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${o}]
          });
        }

        if (${n}_present) {
          if (${n}.value === undefined) {
            newResult[${o}] = undefined;
          } else {
            newResult[${o}] = ${n}.value;
          }
        }

      `)}t.write(`payload.value = newResult;`),t.write(`return payload;`);let s=t.compile();return(t,n)=>s(e,t,n)},a,o=Ph,s=!yh.jitless,c=s&&Fh.value,l=t.catchall,u;e._zod.parse=(d,f)=>{u??=r.value;let p=d.value;return o(p)?s&&c&&f?.async===!1&&f.jitless!==!0?(a||=i(t.shape),d=a(d,f),l?nv([],p,d,f,u,e):d):n(d,f):(d.issues.push({expected:`object`,code:`invalid_type`,input:p,inst:e}),d)}});function av(e,t,n,r){for(let n of e)if(n.issues.length===0)return t.value=n.value,t;let i=e.filter(e=>!Xh(e));return i.length===1?(t.value=i[0].value,i[0]):(t.issues.push({code:`invalid_union`,input:t.value,inst:n,errors:e.map(e=>e.issues.map(e=>eg(e,r,bh())))}),t)}var ov=X(`$ZodUnion`,(e,t)=>{v_.init(e,t),Oh(e._zod,`optin`,()=>t.options.some(e=>e._zod.optin===`optional`)?`optional`:void 0),Oh(e._zod,`optout`,()=>t.options.some(e=>e._zod.optout===`optional`)?`optional`:void 0),Oh(e._zod,`values`,()=>{if(t.options.every(e=>e._zod.values))return new Set(t.options.flatMap(e=>Array.from(e._zod.values)))}),Oh(e._zod,`pattern`,()=>{if(t.options.every(e=>e._zod.pattern)){let e=t.options.map(e=>e._zod.pattern);return RegExp(`^(${e.map(e=>Th(e.source)).join(`|`)})$`)}});let n=t.options.length===1?t.options[0]._zod.run:null;e._zod.parse=(r,i)=>{if(n)return n(r,i);let a=!1,o=[];for(let e of t.options){let t=e._zod.run({value:r.value,issues:[]},i);if(t instanceof Promise)o.push(t),a=!0;else{if(t.issues.length===0)return t;o.push(t)}}return a?Promise.all(o).then(t=>av(t,r,e,i)):av(o,r,e,i)}}),sv=X(`$ZodIntersection`,(e,t)=>{v_.init(e,t),e._zod.parse=(e,n)=>{let r=e.value,i=t.left._zod.run({value:r,issues:[]},n),a=t.right._zod.run({value:r,issues:[]},n);return i instanceof Promise||a instanceof Promise?Promise.all([i,a]).then(([t,n])=>lv(e,t,n)):lv(e,i,a)}});function cv(e,t){if(e===t||e instanceof Date&&t instanceof Date&&+e==+t)return{valid:!0,data:e};if(Ih(e)&&Ih(t)){let n=Object.keys(t),r=Object.keys(e).filter(e=>n.indexOf(e)!==-1),i={...e,...t};for(let n of r){let r=cv(e[n],t[n]);if(!r.valid)return{valid:!1,mergeErrorPath:[n,...r.mergeErrorPath]};i[n]=r.data}return{valid:!0,data:i}}if(Array.isArray(e)&&Array.isArray(t)){if(e.length!==t.length)return{valid:!1,mergeErrorPath:[]};let n=[];for(let r=0;r<e.length;r++){let i=e[r],a=t[r],o=cv(i,a);if(!o.valid)return{valid:!1,mergeErrorPath:[r,...o.mergeErrorPath]};n.push(o.data)}return{valid:!0,data:n}}return{valid:!1,mergeErrorPath:[]}}function lv(e,t,n){let r=new Map,i;for(let n of t.issues)if(n.code===`unrecognized_keys`){i??=n;for(let e of n.keys)r.has(e)||r.set(e,{}),r.get(e).l=!0}else e.issues.push(n);for(let t of n.issues)if(t.code===`unrecognized_keys`)for(let e of t.keys)r.has(e)||r.set(e,{}),r.get(e).r=!0;else e.issues.push(t);let a=[...r].filter(([,e])=>e.l&&e.r).map(([e])=>e);if(a.length&&i&&e.issues.push({...i,keys:a}),Xh(e))return e;let o=cv(t.value,n.value);if(!o.valid)throw Error(`Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`);return e.value=o.data,e}var uv=X(`$ZodRecord`,(e,t)=>{v_.init(e,t),e._zod.parse=(n,r)=>{let i=n.value;if(!Ih(i))return n.issues.push({expected:`record`,code:`invalid_type`,input:i,inst:e}),n;let a=[],o=t.keyType._zod.values;if(o){n.value={};let s=new Set;for(let c of o)if(typeof c==`string`||typeof c==`number`||typeof c==`symbol`){s.add(typeof c==`number`?c.toString():c);let o=t.keyType._zod.run({value:c,issues:[]},r);if(o instanceof Promise)throw Error(`Async schemas not supported in object keys currently`);if(o.issues.length){n.issues.push({code:`invalid_key`,origin:`record`,issues:o.issues.map(e=>eg(e,r,bh())),input:c,path:[c],inst:e});continue}let l=o.value,u=t.valueType._zod.run({value:i[c],issues:[]},r);u instanceof Promise?a.push(u.then(e=>{e.issues.length&&n.issues.push(...Qh(c,e.issues)),n.value[l]=e.value})):(u.issues.length&&n.issues.push(...Qh(c,u.issues)),n.value[l]=u.value)}let c;for(let e in i)s.has(e)||(c??=[],c.push(e));c&&c.length>0&&n.issues.push({code:`unrecognized_keys`,input:i,inst:e,keys:c})}else{n.value={};for(let o of Reflect.ownKeys(i)){if(o===`__proto__`||!Object.prototype.propertyIsEnumerable.call(i,o))continue;let s=t.keyType._zod.run({value:o,issues:[]},r);if(s instanceof Promise)throw Error(`Async schemas not supported in object keys currently`);if(typeof o==`string`&&Yg.test(o)&&s.issues.length){let e=t.keyType._zod.run({value:Number(o),issues:[]},r);if(e instanceof Promise)throw Error(`Async schemas not supported in object keys currently`);e.issues.length===0&&(s=e)}if(s.issues.length){t.mode===`loose`?n.value[o]=i[o]:n.issues.push({code:`invalid_key`,origin:`record`,issues:s.issues.map(e=>eg(e,r,bh())),input:o,path:[o],inst:e});continue}let c=t.valueType._zod.run({value:i[o],issues:[]},r);c instanceof Promise?a.push(c.then(e=>{e.issues.length&&n.issues.push(...Qh(o,e.issues)),n.value[s.value]=e.value})):(c.issues.length&&n.issues.push(...Qh(o,c.issues)),n.value[s.value]=c.value)}}return a.length?Promise.all(a).then(()=>n):n}}),dv=X(`$ZodEnum`,(e,t)=>{v_.init(e,t);let n=xh(t.entries),r=new Set(n);e._zod.values=r,e._zod.pattern=RegExp(`^(${n.filter(e=>Rh.has(typeof e)).map(e=>typeof e==`string`?zh(e):e.toString()).join(`|`)})$`),e._zod.parse=(t,i)=>{let a=t.value;return r.has(a)||t.issues.push({code:`invalid_value`,values:n,input:a,inst:e}),t}}),fv=X(`$ZodTransform`,(e,t)=>{v_.init(e,t),e._zod.optin=`optional`,e._zod.parse=(n,r)=>{if(r.direction===`backward`)throw new vh(e.constructor.name);let i=t.transform(n.value,n);if(r.async)return(i instanceof Promise?i:Promise.resolve(i)).then(e=>(n.value=e,n.fallback=!0,n));if(i instanceof Promise)throw new _h;return n.value=i,n.fallback=!0,n}});function pv(e,t){return t===void 0&&(e.issues.length||e.fallback)?{issues:[],value:void 0}:e}var mv=X(`$ZodOptional`,(e,t)=>{v_.init(e,t),e._zod.optin=`optional`,e._zod.optout=`optional`,Oh(e._zod,`values`,()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,void 0]):void 0),Oh(e._zod,`pattern`,()=>{let e=t.innerType._zod.pattern;return e?RegExp(`^(${Th(e.source)})?$`):void 0}),e._zod.parse=(e,n)=>{if(t.innerType._zod.optin===`optional`){let r=e.value,i=t.innerType._zod.run(e,n);return i instanceof Promise?i.then(e=>pv(e,r)):pv(i,r)}return e.value===void 0?e:t.innerType._zod.run(e,n)}}),hv=X(`$ZodExactOptional`,(e,t)=>{mv.init(e,t),Oh(e._zod,`values`,()=>t.innerType._zod.values),Oh(e._zod,`pattern`,()=>t.innerType._zod.pattern),e._zod.parse=(e,n)=>t.innerType._zod.run(e,n)}),gv=X(`$ZodNullable`,(e,t)=>{v_.init(e,t),Oh(e._zod,`optin`,()=>t.innerType._zod.optin),Oh(e._zod,`optout`,()=>t.innerType._zod.optout),Oh(e._zod,`pattern`,()=>{let e=t.innerType._zod.pattern;return e?RegExp(`^(${Th(e.source)}|null)$`):void 0}),Oh(e._zod,`values`,()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,null]):void 0),e._zod.parse=(e,n)=>e.value===null?e:t.innerType._zod.run(e,n)}),_v=X(`$ZodDefault`,(e,t)=>{v_.init(e,t),e._zod.optin=`optional`,Oh(e._zod,`values`,()=>t.innerType._zod.values),e._zod.parse=(e,n)=>{if(n.direction===`backward`)return t.innerType._zod.run(e,n);if(e.value===void 0)return e.value=t.defaultValue,e;let r=t.innerType._zod.run(e,n);return r instanceof Promise?r.then(e=>vv(e,t)):vv(r,t)}});function vv(e,t){return e.value===void 0&&(e.value=t.defaultValue),e}var yv=X(`$ZodPrefault`,(e,t)=>{v_.init(e,t),e._zod.optin=`optional`,Oh(e._zod,`values`,()=>t.innerType._zod.values),e._zod.parse=(e,n)=>(n.direction===`backward`||e.value===void 0&&(e.value=t.defaultValue),t.innerType._zod.run(e,n))}),bv=X(`$ZodNonOptional`,(e,t)=>{v_.init(e,t),Oh(e._zod,`values`,()=>{let e=t.innerType._zod.values;return e?new Set([...e].filter(e=>e!==void 0)):void 0}),e._zod.parse=(n,r)=>{let i=t.innerType._zod.run(n,r);return i instanceof Promise?i.then(t=>xv(t,e)):xv(i,e)}});function xv(e,t){return!e.issues.length&&e.value===void 0&&e.issues.push({code:`invalid_type`,expected:`nonoptional`,input:e.value,inst:t}),e}var Sv=X(`$ZodCatch`,(e,t)=>{v_.init(e,t),e._zod.optin=`optional`,Oh(e._zod,`optout`,()=>t.innerType._zod.optout),Oh(e._zod,`values`,()=>t.innerType._zod.values),e._zod.parse=(e,n)=>{if(n.direction===`backward`)return t.innerType._zod.run(e,n);let r=t.innerType._zod.run(e,n);return r instanceof Promise?r.then(r=>(e.value=r.value,r.issues.length&&(e.value=t.catchValue({...e,error:{issues:r.issues.map(e=>eg(e,n,bh()))},input:e.value}),e.issues=[],e.fallback=!0),e)):(e.value=r.value,r.issues.length&&(e.value=t.catchValue({...e,error:{issues:r.issues.map(e=>eg(e,n,bh()))},input:e.value}),e.issues=[],e.fallback=!0),e)}}),Cv=X(`$ZodPipe`,(e,t)=>{v_.init(e,t),Oh(e._zod,`values`,()=>t.in._zod.values),Oh(e._zod,`optin`,()=>t.in._zod.optin),Oh(e._zod,`optout`,()=>t.out._zod.optout),Oh(e._zod,`propValues`,()=>t.in._zod.propValues),e._zod.parse=(e,n)=>{if(n.direction===`backward`){let r=t.out._zod.run(e,n);return r instanceof Promise?r.then(e=>wv(e,t.in,n)):wv(r,t.in,n)}let r=t.in._zod.run(e,n);return r instanceof Promise?r.then(e=>wv(e,t.out,n)):wv(r,t.out,n)}});function wv(e,t,n){return e.issues.length?(e.aborted=!0,e):t._zod.run({value:e.value,issues:e.issues,fallback:e.fallback},n)}var Tv=X(`$ZodReadonly`,(e,t)=>{v_.init(e,t),Oh(e._zod,`propValues`,()=>t.innerType._zod.propValues),Oh(e._zod,`values`,()=>t.innerType._zod.values),Oh(e._zod,`optin`,()=>t.innerType?._zod?.optin),Oh(e._zod,`optout`,()=>t.innerType?._zod?.optout),e._zod.parse=(e,n)=>{if(n.direction===`backward`)return t.innerType._zod.run(e,n);let r=t.innerType._zod.run(e,n);return r instanceof Promise?r.then(Ev):Ev(r)}});function Ev(e){return e.value=Object.freeze(e.value),e}var Dv=X(`$ZodCustom`,(e,t)=>{$g.init(e,t),v_.init(e,t),e._zod.parse=(e,t)=>e,e._zod.check=n=>{let r=n.value,i=t.fn(r);if(i instanceof Promise)return i.then(t=>Ov(t,n,r,e));Ov(i,n,r,e)}});function Ov(e,t,n,r){if(!e){let e={code:`custom`,input:n,inst:r,path:[...r._zod.def.path??[]],continue:!r._zod.def.abort};r._zod.def.params&&(e.params=r._zod.def.params),t.issues.push(ng(e))}}var kv,Av=class{constructor(){this._map=new WeakMap,this._idmap=new Map}add(e,...t){let n=t[0];return this._map.set(e,n),n&&typeof n==`object`&&`id`in n&&this._idmap.set(n.id,e),this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(e){let t=this._map.get(e);return t&&typeof t==`object`&&`id`in t&&this._idmap.delete(t.id),this._map.delete(e),this}get(e){let t=e._zod.parent;if(t){let n={...this.get(t)??{}};delete n.id;let r={...n,...this._map.get(e)};return Object.keys(r).length?r:void 0}return this._map.get(e)}has(e){return this._map.has(e)}};function jv(){return new Av}(kv=globalThis).__zod_globalRegistry??(kv.__zod_globalRegistry=jv());var Mv=globalThis.__zod_globalRegistry;function Nv(e,t){return new e({type:`string`,...Z(t)})}function Pv(e,t){return new e({type:`string`,format:`email`,check:`string_format`,abort:!1,...Z(t)})}function Fv(e,t){return new e({type:`string`,format:`guid`,check:`string_format`,abort:!1,...Z(t)})}function Iv(e,t){return new e({type:`string`,format:`uuid`,check:`string_format`,abort:!1,...Z(t)})}function Lv(e,t){return new e({type:`string`,format:`uuid`,check:`string_format`,abort:!1,version:`v4`,...Z(t)})}function Rv(e,t){return new e({type:`string`,format:`uuid`,check:`string_format`,abort:!1,version:`v6`,...Z(t)})}function zv(e,t){return new e({type:`string`,format:`uuid`,check:`string_format`,abort:!1,version:`v7`,...Z(t)})}function Bv(e,t){return new e({type:`string`,format:`url`,check:`string_format`,abort:!1,...Z(t)})}function Vv(e,t){return new e({type:`string`,format:`emoji`,check:`string_format`,abort:!1,...Z(t)})}function Hv(e,t){return new e({type:`string`,format:`nanoid`,check:`string_format`,abort:!1,...Z(t)})}function Uv(e,t){return new e({type:`string`,format:`cuid`,check:`string_format`,abort:!1,...Z(t)})}function Wv(e,t){return new e({type:`string`,format:`cuid2`,check:`string_format`,abort:!1,...Z(t)})}function Gv(e,t){return new e({type:`string`,format:`ulid`,check:`string_format`,abort:!1,...Z(t)})}function Kv(e,t){return new e({type:`string`,format:`xid`,check:`string_format`,abort:!1,...Z(t)})}function qv(e,t){return new e({type:`string`,format:`ksuid`,check:`string_format`,abort:!1,...Z(t)})}function Jv(e,t){return new e({type:`string`,format:`ipv4`,check:`string_format`,abort:!1,...Z(t)})}function Yv(e,t){return new e({type:`string`,format:`ipv6`,check:`string_format`,abort:!1,...Z(t)})}function Xv(e,t){return new e({type:`string`,format:`cidrv4`,check:`string_format`,abort:!1,...Z(t)})}function Zv(e,t){return new e({type:`string`,format:`cidrv6`,check:`string_format`,abort:!1,...Z(t)})}function Qv(e,t){return new e({type:`string`,format:`base64`,check:`string_format`,abort:!1,...Z(t)})}function $v(e,t){return new e({type:`string`,format:`base64url`,check:`string_format`,abort:!1,...Z(t)})}function ey(e,t){return new e({type:`string`,format:`e164`,check:`string_format`,abort:!1,...Z(t)})}function ty(e,t){return new e({type:`string`,format:`jwt`,check:`string_format`,abort:!1,...Z(t)})}function ny(e,t){return new e({type:`string`,format:`datetime`,check:`string_format`,offset:!1,local:!1,precision:null,...Z(t)})}function ry(e,t){return new e({type:`string`,format:`date`,check:`string_format`,...Z(t)})}function iy(e,t){return new e({type:`string`,format:`time`,check:`string_format`,precision:null,...Z(t)})}function ay(e,t){return new e({type:`string`,format:`duration`,check:`string_format`,...Z(t)})}function oy(e,t){return new e({type:`number`,checks:[],...Z(t)})}function sy(e,t){return new e({type:`number`,check:`number_format`,abort:!1,format:`safeint`,...Z(t)})}function cy(e,t){return new e({type:`boolean`,...Z(t)})}function ly(e){return new e({type:`unknown`})}function uy(e,t){return new e({type:`never`,...Z(t)})}function dy(e,t){return new t_({check:`less_than`,...Z(t),value:e,inclusive:!1})}function fy(e,t){return new t_({check:`less_than`,...Z(t),value:e,inclusive:!0})}function py(e,t){return new n_({check:`greater_than`,...Z(t),value:e,inclusive:!1})}function my(e,t){return new n_({check:`greater_than`,...Z(t),value:e,inclusive:!0})}function hy(e,t){return new r_({check:`multiple_of`,...Z(t),value:e})}function gy(e,t){return new a_({check:`max_length`,...Z(t),maximum:e})}function _y(e,t){return new o_({check:`min_length`,...Z(t),minimum:e})}function vy(e,t){return new s_({check:`length_equals`,...Z(t),length:e})}function yy(e,t){return new l_({check:`string_format`,format:`regex`,...Z(t),pattern:e})}function by(e){return new u_({check:`string_format`,format:`lowercase`,...Z(e)})}function xy(e){return new d_({check:`string_format`,format:`uppercase`,...Z(e)})}function Sy(e,t){return new f_({check:`string_format`,format:`includes`,...Z(t),includes:e})}function Cy(e,t){return new p_({check:`string_format`,format:`starts_with`,...Z(t),prefix:e})}function wy(e,t){return new m_({check:`string_format`,format:`ends_with`,...Z(t),suffix:e})}function Ty(e){return new h_({check:`overwrite`,tx:e})}function Ey(e){return Ty(t=>t.normalize(e))}function Dy(){return Ty(e=>e.trim())}function Oy(){return Ty(e=>e.toLowerCase())}function ky(){return Ty(e=>e.toUpperCase())}function Ay(){return Ty(e=>Mh(e))}function jy(e,t,n){return new e({type:`array`,element:t,...Z(n)})}function My(e,t,n){return new e({type:`custom`,check:`custom`,fn:t,...Z(n)})}function Ny(e,t){let n=Py(t=>(t.addIssue=e=>{if(typeof e==`string`)t.issues.push(ng(e,t.value,n._zod.def));else{let r=e;r.fatal&&(r.continue=!1),r.code??=`custom`,r.input??=t.value,r.inst??=n,r.continue??=!n._zod.def.abort,t.issues.push(ng(r))}},e(t.value,t)),t);return n}function Py(e,t){let n=new $g({check:`custom`,...Z(t)});return n._zod.check=e,n}function Fy(e){let t=e?.target??`draft-2020-12`;return t===`draft-4`&&(t=`draft-04`),t===`draft-7`&&(t=`draft-07`),{processors:e.processors??{},metadataRegistry:e?.metadata??Mv,target:t,unrepresentable:e?.unrepresentable??`throw`,override:e?.override??(()=>{}),io:e?.io??`output`,counter:0,seen:new Map,cycles:e?.cycles??`ref`,reused:e?.reused??`inline`,external:e?.external??void 0}}function Iy(e,t,n={path:[],schemaPath:[]}){var r;let i=e._zod.def,a=t.seen.get(e);if(a)return a.count++,n.schemaPath.includes(e)&&(a.cycle=n.path),a.schema;let o={schema:{},count:1,cycle:void 0,path:n.path};t.seen.set(e,o);let s=e._zod.toJSONSchema?.();if(s)o.schema=s;else{let r={...n,schemaPath:[...n.schemaPath,e],path:n.path};if(e._zod.processJSONSchema)e._zod.processJSONSchema(t,o.schema,r);else{let n=o.schema,a=t.processors[i.type];if(!a)throw Error(`[toJSONSchema]: Non-representable type encountered: ${i.type}`);a(e,t,n,r)}let a=e._zod.parent;a&&(o.ref||=a,Iy(a,t,r),t.seen.get(a).isParent=!0)}let c=t.metadataRegistry.get(e);return c&&Object.assign(o.schema,c),t.io===`input`&&zy(e)&&(delete o.schema.examples,delete o.schema.default),t.io===`input`&&`_prefault`in o.schema&&((r=o.schema).default??(r.default=o.schema._prefault)),delete o.schema._prefault,t.seen.get(e).schema}function Ly(e,t){let n=e.seen.get(t);if(!n)throw Error(`Unprocessed schema. This is a bug in Zod.`);let r=new Map;for(let t of e.seen.entries()){let n=e.metadataRegistry.get(t[0])?.id;if(n){let e=r.get(n);if(e&&e!==t[0])throw Error(`Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);r.set(n,t[0])}}let i=t=>{let r=e.target===`draft-2020-12`?`$defs`:`definitions`;if(e.external){let n=e.external.registry.get(t[0])?.id,i=e.external.uri??(e=>e);if(n)return{ref:i(n)};let a=t[1].defId??t[1].schema.id??`schema${e.counter++}`;return t[1].defId=a,{defId:a,ref:`${i(`__shared`)}#/${r}/${a}`}}if(t[1]===n)return{ref:`#`};let i=`#/${r}/`,a=t[1].schema.id??`__schema${e.counter++}`;return{defId:a,ref:i+a}},a=e=>{if(e[1].schema.$ref)return;let t=e[1],{ref:n,defId:r}=i(e);t.def={...t.schema},r&&(t.defId=r);let a=t.schema;for(let e in a)delete a[e];a.$ref=n};if(e.cycles===`throw`)for(let t of e.seen.entries()){let e=t[1];if(e.cycle)throw Error(`Cycle detected: #/${e.cycle?.join(`/`)}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(let n of e.seen.entries()){let r=n[1];if(t===n[0]){a(n);continue}if(e.external){let r=e.external.registry.get(n[0])?.id;if(t!==n[0]&&r){a(n);continue}}if(e.metadataRegistry.get(n[0])?.id){a(n);continue}if(r.cycle){a(n);continue}if(r.count>1&&e.reused===`ref`){a(n);continue}}}function Ry(e,t){let n=e.seen.get(t);if(!n)throw Error(`Unprocessed schema. This is a bug in Zod.`);let r=t=>{let n=e.seen.get(t);if(n.ref===null)return;let i=n.def??n.schema,a={...i},o=n.ref;if(n.ref=null,o){r(o);let n=e.seen.get(o),s=n.schema;if(s.$ref&&(e.target===`draft-07`||e.target===`draft-04`||e.target===`openapi-3.0`)?(i.allOf=i.allOf??[],i.allOf.push(s)):Object.assign(i,s),Object.assign(i,a),t._zod.parent===o)for(let e in i)e===`$ref`||e===`allOf`||e in a||delete i[e];if(s.$ref&&n.def)for(let e in i)e===`$ref`||e===`allOf`||e in n.def&&JSON.stringify(i[e])===JSON.stringify(n.def[e])&&delete i[e]}let s=t._zod.parent;if(s&&s!==o){r(s);let t=e.seen.get(s);if(t?.schema.$ref&&(i.$ref=t.schema.$ref,t.def))for(let e in i)e===`$ref`||e===`allOf`||e in t.def&&JSON.stringify(i[e])===JSON.stringify(t.def[e])&&delete i[e]}e.override({zodSchema:t,jsonSchema:i,path:n.path??[]})};for(let t of[...e.seen.entries()].reverse())r(t[0]);let i={};if(e.target===`draft-2020-12`?i.$schema=`https://json-schema.org/draft/2020-12/schema`:e.target===`draft-07`?i.$schema=`http://json-schema.org/draft-07/schema#`:e.target===`draft-04`?i.$schema=`http://json-schema.org/draft-04/schema#`:e.target,e.external?.uri){let n=e.external.registry.get(t)?.id;if(!n)throw Error("Schema is missing an `id` property");i.$id=e.external.uri(n)}Object.assign(i,n.def??n.schema);let a=e.metadataRegistry.get(t)?.id;a!==void 0&&i.id===a&&delete i.id;let o=e.external?.defs??{};for(let t of e.seen.entries()){let e=t[1];e.def&&e.defId&&(e.def.id===e.defId&&delete e.def.id,o[e.defId]=e.def)}e.external||Object.keys(o).length>0&&(e.target===`draft-2020-12`?i.$defs=o:i.definitions=o);try{let n=JSON.parse(JSON.stringify(i));return Object.defineProperty(n,"~standard",{value:{...t[`~standard`],jsonSchema:{input:Vy(t,`input`,e.processors),output:Vy(t,`output`,e.processors)}},enumerable:!1,writable:!1}),n}catch{throw Error(`Error converting schema to JSON.`)}}function zy(e,t){let n=t??{seen:new Set};if(n.seen.has(e))return!1;n.seen.add(e);let r=e._zod.def;if(r.type===`transform`)return!0;if(r.type===`array`)return zy(r.element,n);if(r.type===`set`)return zy(r.valueType,n);if(r.type===`lazy`)return zy(r.getter(),n);if(r.type===`promise`||r.type===`optional`||r.type===`nonoptional`||r.type===`nullable`||r.type===`readonly`||r.type==="default"||r.type===`prefault`)return zy(r.innerType,n);if(r.type===`intersection`)return zy(r.left,n)||zy(r.right,n);if(r.type===`record`||r.type===`map`)return zy(r.keyType,n)||zy(r.valueType,n);if(r.type===`pipe`)return e._zod.traits.has(`$ZodCodec`)?!0:zy(r.in,n)||zy(r.out,n);if(r.type===`object`){for(let e in r.shape)if(zy(r.shape[e],n))return!0;return!1}if(r.type===`union`){for(let e of r.options)if(zy(e,n))return!0;return!1}if(r.type===`tuple`){for(let e of r.items)if(zy(e,n))return!0;return!!(r.rest&&zy(r.rest,n))}return!1}var By=(e,t={})=>n=>{let r=Fy({...n,processors:t});return Iy(e,r),Ly(r,e),Ry(r,e)},Vy=(e,t,n={})=>r=>{let{libraryOptions:i,target:a}=r??{},o=Fy({...i??{},target:a,io:t,processors:n});return Iy(e,o),Ly(o,e),Ry(o,e)},Hy={guid:`uuid`,url:`uri`,datetime:`date-time`,json_string:`json-string`,regex:``},Uy=(e,t,n,r)=>{let i=n;i.type=`string`;let{minimum:a,maximum:o,format:s,patterns:c,contentEncoding:l}=e._zod.bag;if(typeof a==`number`&&(i.minLength=a),typeof o==`number`&&(i.maxLength=o),s&&(i.format=Hy[s]??s,i.format===``&&delete i.format,s===`time`&&delete i.format),l&&(i.contentEncoding=l),c&&c.size>0){let e=[...c];e.length===1?i.pattern=e[0].source:e.length>1&&(i.allOf=[...e.map(e=>({...t.target===`draft-07`||t.target===`draft-04`||t.target===`openapi-3.0`?{type:`string`}:{},pattern:e.source}))])}},Wy=(e,t,n,r)=>{let i=n,{minimum:a,maximum:o,format:s,multipleOf:c,exclusiveMaximum:l,exclusiveMinimum:u}=e._zod.bag;typeof s==`string`&&s.includes(`int`)?i.type=`integer`:i.type=`number`;let d=typeof u==`number`&&u>=(a??-1/0),f=typeof l==`number`&&l<=(o??1/0),p=t.target===`draft-04`||t.target===`openapi-3.0`;d?p?(i.minimum=u,i.exclusiveMinimum=!0):i.exclusiveMinimum=u:typeof a==`number`&&(i.minimum=a),f?p?(i.maximum=l,i.exclusiveMaximum=!0):i.exclusiveMaximum=l:typeof o==`number`&&(i.maximum=o),typeof c==`number`&&(i.multipleOf=c)},Gy=(e,t,n,r)=>{n.type=`boolean`},Ky=(e,t,n,r)=>{n.not={}},qy=(e,t,n,r)=>{let i=e._zod.def,a=xh(i.entries);a.every(e=>typeof e==`number`)&&(n.type=`number`),a.every(e=>typeof e==`string`)&&(n.type=`string`),n.enum=a},Jy=(e,t,n,r)=>{if(t.unrepresentable===`throw`)throw Error(`Custom types cannot be represented in JSON Schema`)},Yy=(e,t,n,r)=>{if(t.unrepresentable===`throw`)throw Error(`Transforms cannot be represented in JSON Schema`)},Xy=(e,t,n,r)=>{let i=n,a=e._zod.def,{minimum:o,maximum:s}=e._zod.bag;typeof o==`number`&&(i.minItems=o),typeof s==`number`&&(i.maxItems=s),i.type=`array`,i.items=Iy(a.element,t,{...r,path:[...r.path,`items`]})},Zy=(e,t,n,r)=>{let i=n,a=e._zod.def;i.type=`object`,i.properties={};let o=a.shape;for(let e in o)i.properties[e]=Iy(o[e],t,{...r,path:[...r.path,`properties`,e]});let s=new Set(Object.keys(o)),c=new Set([...s].filter(e=>{let n=a.shape[e]._zod;return t.io===`input`?n.optin===void 0:n.optout===void 0}));c.size>0&&(i.required=Array.from(c)),a.catchall?._zod.def.type===`never`?i.additionalProperties=!1:a.catchall?a.catchall&&(i.additionalProperties=Iy(a.catchall,t,{...r,path:[...r.path,`additionalProperties`]})):t.io===`output`&&(i.additionalProperties=!1)},Qy=(e,t,n,r)=>{let i=e._zod.def,a=i.inclusive===!1,o=i.options.map((e,n)=>Iy(e,t,{...r,path:[...r.path,a?`oneOf`:`anyOf`,n]}));a?n.oneOf=o:n.anyOf=o},$y=(e,t,n,r)=>{let i=e._zod.def,a=Iy(i.left,t,{...r,path:[...r.path,`allOf`,0]}),o=Iy(i.right,t,{...r,path:[...r.path,`allOf`,1]}),s=e=>`allOf`in e&&Object.keys(e).length===1;n.allOf=[...s(a)?a.allOf:[a],...s(o)?o.allOf:[o]]},eb=(e,t,n,r)=>{let i=n,a=e._zod.def;i.type=`object`;let o=a.keyType,s=o._zod.bag?.patterns;if(a.mode===`loose`&&s&&s.size>0){let e=Iy(a.valueType,t,{...r,path:[...r.path,`patternProperties`,`*`]});i.patternProperties={};for(let t of s)i.patternProperties[t.source]=e}else(t.target===`draft-07`||t.target===`draft-2020-12`)&&(i.propertyNames=Iy(a.keyType,t,{...r,path:[...r.path,`propertyNames`]})),i.additionalProperties=Iy(a.valueType,t,{...r,path:[...r.path,`additionalProperties`]});let c=o._zod.values;if(c){let e=[...c].filter(e=>typeof e==`string`||typeof e==`number`);e.length>0&&(i.required=e)}},tb=(e,t,n,r)=>{let i=e._zod.def,a=Iy(i.innerType,t,r),o=t.seen.get(e);t.target===`openapi-3.0`?(o.ref=i.innerType,n.nullable=!0):n.anyOf=[a,{type:`null`}]},nb=(e,t,n,r)=>{let i=e._zod.def;Iy(i.innerType,t,r);let a=t.seen.get(e);a.ref=i.innerType},rb=(e,t,n,r)=>{let i=e._zod.def;Iy(i.innerType,t,r);let a=t.seen.get(e);a.ref=i.innerType,n.default=JSON.parse(JSON.stringify(i.defaultValue))},ib=(e,t,n,r)=>{let i=e._zod.def;Iy(i.innerType,t,r);let a=t.seen.get(e);a.ref=i.innerType,t.io===`input`&&(n._prefault=JSON.parse(JSON.stringify(i.defaultValue)))},ab=(e,t,n,r)=>{let i=e._zod.def;Iy(i.innerType,t,r);let a=t.seen.get(e);a.ref=i.innerType;let o;try{o=i.catchValue(void 0)}catch{throw Error(`Dynamic catch values are not supported in JSON Schema`)}n.default=o},ob=(e,t,n,r)=>{let i=e._zod.def,a=i.in._zod.traits.has(`$ZodTransform`),o=t.io===`input`?a?i.out:i.in:i.out;Iy(o,t,r);let s=t.seen.get(e);s.ref=o},sb=(e,t,n,r)=>{let i=e._zod.def;Iy(i.innerType,t,r);let a=t.seen.get(e);a.ref=i.innerType,n.readOnly=!0},cb=(e,t,n,r)=>{let i=e._zod.def;Iy(i.innerType,t,r);let a=t.seen.get(e);a.ref=i.innerType},lb=X(`ZodISODateTime`,(e,t)=>{M_.init(e,t),Ib.init(e,t)});function ub(e){return ny(lb,e)}var db=X(`ZodISODate`,(e,t)=>{N_.init(e,t),Ib.init(e,t)});function fb(e){return ry(db,e)}var pb=X(`ZodISOTime`,(e,t)=>{P_.init(e,t),Ib.init(e,t)});function mb(e){return iy(pb,e)}var hb=X(`ZodISODuration`,(e,t)=>{F_.init(e,t),Ib.init(e,t)});function gb(e){return ay(hb,e)}var _b=X(`ZodError`,(e,t)=>{ig.init(e,t),e.name=`ZodError`,Object.defineProperties(e,{format:{value:t=>sg(e,t)},flatten:{value:t=>og(e,t)},addIssue:{value:t=>{e.issues.push(t),e.message=JSON.stringify(e.issues,Sh,2)}},addIssues:{value:t=>{e.issues.push(...t),e.message=JSON.stringify(e.issues,Sh,2)}},isEmpty:{get(){return e.issues.length===0}}})},{Parent:Error}),vb=cg(_b),yb=lg(_b),bb=ug(_b),xb=fg(_b),Sb=mg(_b),Cb=hg(_b),wb=gg(_b),Tb=_g(_b),Eb=vg(_b),Db=yg(_b),Ob=bg(_b),kb=xg(_b),Ab=new WeakMap;function jb(e,t,n){let r=Object.getPrototypeOf(e),i=Ab.get(r);if(i||(i=new Set,Ab.set(r,i)),!i.has(t)){i.add(t);for(let e in n){let t=n[e];Object.defineProperty(r,e,{configurable:!0,enumerable:!1,get(){let n=t.bind(this);return Object.defineProperty(this,e,{configurable:!0,writable:!0,enumerable:!0,value:n}),n},set(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,enumerable:!0,value:t})}})}}}var Mb=X(`ZodType`,(e,t)=>(v_.init(e,t),Object.assign(e[`~standard`],{jsonSchema:{input:Vy(e,`input`),output:Vy(e,`output`)}}),e.toJSONSchema=By(e,{}),e.def=t,e.type=t.type,Object.defineProperty(e,"_def",{value:t}),e.parse=(t,n)=>vb(e,t,n,{callee:e.parse}),e.safeParse=(t,n)=>bb(e,t,n),e.parseAsync=async(t,n)=>yb(e,t,n,{callee:e.parseAsync}),e.safeParseAsync=async(t,n)=>xb(e,t,n),e.spa=e.safeParseAsync,e.encode=(t,n)=>Sb(e,t,n),e.decode=(t,n)=>Cb(e,t,n),e.encodeAsync=async(t,n)=>wb(e,t,n),e.decodeAsync=async(t,n)=>Tb(e,t,n),e.safeEncode=(t,n)=>Eb(e,t,n),e.safeDecode=(t,n)=>Db(e,t,n),e.safeEncodeAsync=async(t,n)=>Ob(e,t,n),e.safeDecodeAsync=async(t,n)=>kb(e,t,n),jb(e,`ZodType`,{check(...e){let t=this.def;return this.clone(Ah(t,{checks:[...t.checks??[],...e.map(e=>typeof e==`function`?{_zod:{check:e,def:{check:`custom`},onattach:[]}}:e)]}),{parent:!0})},with(...e){return this.check(...e)},clone(e,t){return Bh(this,e,t)},brand(){return this},register(e,t){return e.add(this,t),this},refine(e,t){return this.check(Gx(e,t))},superRefine(e,t){return this.check(Kx(e,t))},overwrite(e){return this.check(Ty(e))},optional(){return Dx(this)},exactOptional(){return kx(this)},nullable(){return jx(this)},nullish(){return Dx(jx(this))},nonoptional(e){return Lx(this,e)},array(){return px(this)},or(e){return _x([this,e])},and(e){return yx(this,e)},transform(e){return Vx(this,Tx(e))},default(e){return Nx(this,e)},prefault(e){return Fx(this,e)},catch(e){return zx(this,e)},pipe(e){return Vx(this,e)},readonly(){return Ux(this)},describe(e){let t=this.clone();return Mv.add(t,{description:e}),t},meta(...e){if(e.length===0)return Mv.get(this);let t=this.clone();return Mv.add(t,e[0]),t},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(e){return e(this)}}),Object.defineProperty(e,"description",{get(){return Mv.get(e)?.description},configurable:!0}),e)),Nb=X(`_ZodString`,(e,t)=>{y_.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>Uy(e,t,n,r);let n=e._zod.bag;e.format=n.format??null,e.minLength=n.minimum??null,e.maxLength=n.maximum??null,jb(e,`_ZodString`,{regex(...e){return this.check(yy(...e))},includes(...e){return this.check(Sy(...e))},startsWith(...e){return this.check(Cy(...e))},endsWith(...e){return this.check(wy(...e))},min(...e){return this.check(_y(...e))},max(...e){return this.check(gy(...e))},length(...e){return this.check(vy(...e))},nonempty(...e){return this.check(_y(1,...e))},lowercase(e){return this.check(by(e))},uppercase(e){return this.check(xy(e))},trim(){return this.check(Dy())},normalize(...e){return this.check(Ey(...e))},toLowerCase(){return this.check(Oy())},toUpperCase(){return this.check(ky())},slugify(){return this.check(Ay())}})}),Pb=X(`ZodString`,(e,t)=>{y_.init(e,t),Nb.init(e,t),e.email=t=>e.check(Pv(Lb,t)),e.url=t=>e.check(Bv(Bb,t)),e.jwt=t=>e.check(ty(tx,t)),e.emoji=t=>e.check(Vv(Vb,t)),e.guid=t=>e.check(Fv(Rb,t)),e.uuid=t=>e.check(Iv(zb,t)),e.uuidv4=t=>e.check(Lv(zb,t)),e.uuidv6=t=>e.check(Rv(zb,t)),e.uuidv7=t=>e.check(zv(zb,t)),e.nanoid=t=>e.check(Hv(Hb,t)),e.guid=t=>e.check(Fv(Rb,t)),e.cuid=t=>e.check(Uv(Ub,t)),e.cuid2=t=>e.check(Wv(Wb,t)),e.ulid=t=>e.check(Gv(Gb,t)),e.base64=t=>e.check(Qv(Qb,t)),e.base64url=t=>e.check($v($b,t)),e.xid=t=>e.check(Kv(Kb,t)),e.ksuid=t=>e.check(qv(qb,t)),e.ipv4=t=>e.check(Jv(Jb,t)),e.ipv6=t=>e.check(Yv(Yb,t)),e.cidrv4=t=>e.check(Xv(Xb,t)),e.cidrv6=t=>e.check(Zv(Zb,t)),e.e164=t=>e.check(ey(ex,t)),e.datetime=t=>e.check(ub(t)),e.date=t=>e.check(fb(t)),e.time=t=>e.check(mb(t)),e.duration=t=>e.check(gb(t))});function Fb(e){return Nv(Pb,e)}var Ib=X(`ZodStringFormat`,(e,t)=>{b_.init(e,t),Nb.init(e,t)}),Lb=X(`ZodEmail`,(e,t)=>{C_.init(e,t),Ib.init(e,t)}),Rb=X(`ZodGUID`,(e,t)=>{x_.init(e,t),Ib.init(e,t)}),zb=X(`ZodUUID`,(e,t)=>{S_.init(e,t),Ib.init(e,t)}),Bb=X(`ZodURL`,(e,t)=>{w_.init(e,t),Ib.init(e,t)}),Vb=X(`ZodEmoji`,(e,t)=>{T_.init(e,t),Ib.init(e,t)}),Hb=X(`ZodNanoID`,(e,t)=>{E_.init(e,t),Ib.init(e,t)}),Ub=X(`ZodCUID`,(e,t)=>{D_.init(e,t),Ib.init(e,t)}),Wb=X(`ZodCUID2`,(e,t)=>{O_.init(e,t),Ib.init(e,t)}),Gb=X(`ZodULID`,(e,t)=>{k_.init(e,t),Ib.init(e,t)}),Kb=X(`ZodXID`,(e,t)=>{A_.init(e,t),Ib.init(e,t)}),qb=X(`ZodKSUID`,(e,t)=>{j_.init(e,t),Ib.init(e,t)}),Jb=X(`ZodIPv4`,(e,t)=>{I_.init(e,t),Ib.init(e,t)}),Yb=X(`ZodIPv6`,(e,t)=>{L_.init(e,t),Ib.init(e,t)}),Xb=X(`ZodCIDRv4`,(e,t)=>{R_.init(e,t),Ib.init(e,t)}),Zb=X(`ZodCIDRv6`,(e,t)=>{z_.init(e,t),Ib.init(e,t)}),Qb=X(`ZodBase64`,(e,t)=>{V_.init(e,t),Ib.init(e,t)}),$b=X(`ZodBase64URL`,(e,t)=>{U_.init(e,t),Ib.init(e,t)}),ex=X(`ZodE164`,(e,t)=>{W_.init(e,t),Ib.init(e,t)}),tx=X(`ZodJWT`,(e,t)=>{K_.init(e,t),Ib.init(e,t)}),nx=X(`ZodNumber`,(e,t)=>{q_.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>Wy(e,t,n,r),jb(e,`ZodNumber`,{gt(e,t){return this.check(py(e,t))},gte(e,t){return this.check(my(e,t))},min(e,t){return this.check(my(e,t))},lt(e,t){return this.check(dy(e,t))},lte(e,t){return this.check(fy(e,t))},max(e,t){return this.check(fy(e,t))},int(e){return this.check(ax(e))},safe(e){return this.check(ax(e))},positive(e){return this.check(py(0,e))},nonnegative(e){return this.check(my(0,e))},negative(e){return this.check(dy(0,e))},nonpositive(e){return this.check(fy(0,e))},multipleOf(e,t){return this.check(hy(e,t))},step(e,t){return this.check(hy(e,t))},finite(){return this}});let n=e._zod.bag;e.minValue=Math.max(n.minimum??-1/0,n.exclusiveMinimum??-1/0)??null,e.maxValue=Math.min(n.maximum??1/0,n.exclusiveMaximum??1/0)??null,e.isInt=(n.format??``).includes(`int`)||Number.isSafeInteger(n.multipleOf??.5),e.isFinite=!0,e.format=n.format??null});function rx(e){return oy(nx,e)}var ix=X(`ZodNumberFormat`,(e,t)=>{J_.init(e,t),nx.init(e,t)});function ax(e){return sy(ix,e)}var ox=X(`ZodBoolean`,(e,t)=>{Y_.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>Gy(e,t,n,r)});function sx(e){return cy(ox,e)}var cx=X(`ZodUnknown`,(e,t)=>{X_.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(e,t,n)=>void 0});function lx(){return ly(cx)}var ux=X(`ZodNever`,(e,t)=>{Z_.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>Ky(e,t,n,r)});function dx(e){return uy(ux,e)}var fx=X(`ZodArray`,(e,t)=>{$_.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>Xy(e,t,n,r),e.element=t.element,jb(e,`ZodArray`,{min(e,t){return this.check(_y(e,t))},nonempty(e){return this.check(_y(1,e))},max(e,t){return this.check(gy(e,t))},length(e,t){return this.check(vy(e,t))},unwrap(){return this.element}})});function px(e,t){return jy(fx,e,t)}var mx=X(`ZodObject`,(e,t)=>{iv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>Zy(e,t,n,r),Oh(e,`shape`,()=>t.shape),jb(e,`ZodObject`,{keyof(){return Cx(Object.keys(this._zod.def.shape))},catchall(e){return this.clone({...this._zod.def,catchall:e})},passthrough(){return this.clone({...this._zod.def,catchall:lx()})},loose(){return this.clone({...this._zod.def,catchall:lx()})},strict(){return this.clone({...this._zod.def,catchall:dx()})},strip(){return this.clone({...this._zod.def,catchall:void 0})},extend(e){return Gh(this,e)},safeExtend(e){return Kh(this,e)},merge(e){return qh(this,e)},pick(e){return Uh(this,e)},omit(e){return Wh(this,e)},partial(...e){return Jh(Ex,this,e[0])},required(...e){return Yh(Ix,this,e[0])}})});function hx(e,t){return new mx({type:`object`,shape:e??{},...Z(t)})}var gx=X(`ZodUnion`,(e,t)=>{ov.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>Qy(e,t,n,r),e.options=t.options});function _x(e,t){return new gx({type:`union`,options:e,...Z(t)})}var vx=X(`ZodIntersection`,(e,t)=>{sv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>$y(e,t,n,r)});function yx(e,t){return new vx({type:`intersection`,left:e,right:t})}var bx=X(`ZodRecord`,(e,t)=>{uv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>eb(e,t,n,r),e.keyType=t.keyType,e.valueType=t.valueType});function xx(e,t,n){return!t||!t._zod?new bx({type:`record`,keyType:Fb(),valueType:e,...Z(t)}):new bx({type:`record`,keyType:e,valueType:t,...Z(n)})}var Sx=X(`ZodEnum`,(e,t)=>{dv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>qy(e,t,n,r),e.enum=t.entries,e.options=Object.values(t.entries);let n=new Set(Object.keys(t.entries));e.extract=(e,r)=>{let i={};for(let r of e)if(n.has(r))i[r]=t.entries[r];else throw Error(`Key ${r} not found in enum`);return new Sx({...t,checks:[],...Z(r),entries:i})},e.exclude=(e,r)=>{let i={...t.entries};for(let t of e)if(n.has(t))delete i[t];else throw Error(`Key ${t} not found in enum`);return new Sx({...t,checks:[],...Z(r),entries:i})}});function Cx(e,t){return new Sx({type:`enum`,entries:Array.isArray(e)?Object.fromEntries(e.map(e=>[e,e])):e,...Z(t)})}var wx=X(`ZodTransform`,(e,t)=>{fv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>Yy(e,t,n,r),e._zod.parse=(n,r)=>{if(r.direction===`backward`)throw new vh(e.constructor.name);n.addIssue=r=>{if(typeof r==`string`)n.issues.push(ng(r,n.value,t));else{let t=r;t.fatal&&(t.continue=!1),t.code??=`custom`,t.input??=n.value,t.inst??=e,n.issues.push(ng(t))}};let i=t.transform(n.value,n);return i instanceof Promise?i.then(e=>(n.value=e,n.fallback=!0,n)):(n.value=i,n.fallback=!0,n)}});function Tx(e){return new wx({type:`transform`,transform:e})}var Ex=X(`ZodOptional`,(e,t)=>{mv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>cb(e,t,n,r),e.unwrap=()=>e._zod.def.innerType});function Dx(e){return new Ex({type:`optional`,innerType:e})}var Ox=X(`ZodExactOptional`,(e,t)=>{hv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>cb(e,t,n,r),e.unwrap=()=>e._zod.def.innerType});function kx(e){return new Ox({type:`optional`,innerType:e})}var Ax=X(`ZodNullable`,(e,t)=>{gv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>tb(e,t,n,r),e.unwrap=()=>e._zod.def.innerType});function jx(e){return new Ax({type:`nullable`,innerType:e})}var Mx=X(`ZodDefault`,(e,t)=>{_v.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>rb(e,t,n,r),e.unwrap=()=>e._zod.def.innerType,e.removeDefault=e.unwrap});function Nx(e,t){return new Mx({type:`default`,innerType:e,get defaultValue(){return typeof t==`function`?t():Lh(t)}})}var Px=X(`ZodPrefault`,(e,t)=>{yv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>ib(e,t,n,r),e.unwrap=()=>e._zod.def.innerType});function Fx(e,t){return new Px({type:`prefault`,innerType:e,get defaultValue(){return typeof t==`function`?t():Lh(t)}})}var Ix=X(`ZodNonOptional`,(e,t)=>{bv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>nb(e,t,n,r),e.unwrap=()=>e._zod.def.innerType});function Lx(e,t){return new Ix({type:`nonoptional`,innerType:e,...Z(t)})}var Rx=X(`ZodCatch`,(e,t)=>{Sv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>ab(e,t,n,r),e.unwrap=()=>e._zod.def.innerType,e.removeCatch=e.unwrap});function zx(e,t){return new Rx({type:`catch`,innerType:e,catchValue:typeof t==`function`?t:()=>t})}var Bx=X(`ZodPipe`,(e,t)=>{Cv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>ob(e,t,n,r),e.in=t.in,e.out=t.out});function Vx(e,t){return new Bx({type:`pipe`,in:e,out:t})}var Hx=X(`ZodReadonly`,(e,t)=>{Tv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>sb(e,t,n,r),e.unwrap=()=>e._zod.def.innerType});function Ux(e){return new Hx({type:`readonly`,innerType:e})}var Wx=X(`ZodCustom`,(e,t)=>{Dv.init(e,t),Mb.init(e,t),e._zod.processJSONSchema=(t,n,r)=>Jy(e,t,n,r)});function Gx(e,t={}){return My(Wx,e,t)}function Kx(e,t){return Ny(e,t)}function qx(e){return(e??``).toString().trim().split(`
`).map(e=>e.replace(/\s+/g,` `).trim()).join(`
`)}function Jx(e){return(e??``).toString().trim().toLowerCase().replace(/[\s_/]+/g,``)}function Yx(e){return/^\[.*\]$/.test(e.trim())}var Xx=Jx(`Complete Translations`),Zx=[`translation`,`complete`,`translat`],Qx=15,$x=10;function eS(e){return/\.(xlsx|xls)$/i.test(e.trim())}function tS(e,t){let n=[],r;try{r=Ym(e,{type:`array`})}catch{return{sourceFileName:t,sheetNames:[],meta:nS(),headerRowNumber:1,rows:[],issues:[{severity:`error`,sheet:``,message:`The file could not be read as a valid Excel workbook.`}]}}let i=r.SheetNames.find(e=>Jx(e)===Xx);if(i||=r.SheetNames.find(e=>{let t=Jx(e);return Zx.some(e=>t.includes(e))}),!i)return{sourceFileName:t,sheetNames:r.SheetNames,meta:nS(),headerRowNumber:1,rows:[],issues:[{severity:`error`,sheet:``,message:`No sheet named "Complete Translations" (or similar) was found. Sheets present: ${r.SheetNames.join(`, `)}.`}]};let a=r.Sheets[i],o=hh.sheet_to_json(a,{header:1,raw:!1,defval:``}),{keyCol:s,englishCol:c,translationCCol:l,translationDCol:u,headerRowNumber:d,headerIssues:f}=aS(o,i);n.push(...f);let p=oS(o,i,c,l,u,n),m=[];for(let e=0;e<o.length;e++){let t=o[e]??[];m.push({rowNumber:e+1,key:qx(t[s]),englishText:qx(t[c]),translationC:qx(t[l]),translationD:qx(t[u])})}return{sourceFileName:t,sheetNames:r.SheetNames,meta:p,headerRowNumber:d,rows:m,issues:n}}function nS(){return{subsidiary:{C:``,D:``},languageCountry:{C:``,D:``},country:{C:``,D:``}}}var rS=[`originalengbtext`,`originaltext`,`sourcetext`,`englishtext`,`english`,`original`,`source`],iS=[`completethistranslationcolumn`,`translationcolumn`,`translation`,`translatetext`,`targettext`,`target`];function aS(e,t){let n=[];for(let t=0;t<Math.min($x,e.length);t++){let r=e[t]??[],i=-1;for(let e=0;e<r.length;e++){let t=Jx(r[e]);if(rS.some(e=>t.includes(e))){i=e;break}}if(i===-1)continue;let a=[];for(let e=0;e<r.length;e++){if(e===i)continue;let t=Jx(r[e]);iS.some(e=>t.includes(e))&&a.push(e)}if(a.length!==0)return{keyCol:Math.max(0,i-1),englishCol:i,translationCCol:a[0]??i+1,translationDCol:a[1]??a[0]??i+2,headerRowNumber:t+1,headerIssues:n}}return n.push({severity:`warning`,sheet:t,row:1,message:`Could not locate English/translation column headers within the first 10 rows; falling back to the standard A/B/C/D column layout.`}),{keyCol:0,englishCol:1,translationCCol:2,translationDCol:3,headerRowNumber:1,headerIssues:n}}function oS(e,t,n,r,i,a){let o=nS(),s={subsidiary:!1,languageCountry:!1,country:!1};for(let t=0;t<Math.min(Qx,e.length);t++){let a=e[t]??[],c=Jx(a[n]),l=qx(a[r]),u=qx(a[i]);c===`subsidiary`?(o.subsidiary={C:l,D:u},s.subsidiary=!0):c===`languagecountry`?(o.languageCountry={C:l,D:u},s.languageCountry=!0):c===`country`&&(o.country={C:l,D:u},s.country=!0)}return s.languageCountry||a.push({severity:`warning`,sheet:t,message:`Could not locate a "Language_Country" metadata row in the first 15 rows.`}),o}var sS=[`ar`,`he`,`ku`,`fa`,`ur`,`yi`];function cS(e){return sS.includes(e.toLowerCase())}var lS={en:`English`,ar:`Arabic`,he:`Hebrew`,ku:`Kurdish`,tr:`Turkish`,fa:`Persian`,ur:`Urdu`,yi:`Yiddish`,fr:`French`,es:`Spanish`,de:`German`,ru:`Russian`,zh:`Chinese`};function uS(e){return lS[e.toLowerCase()]??e.toUpperCase()}var dS=/^([a-z]{2,3})[_-]([a-zA-Z]{2,3})$/,fS=/^[qa]\d+$/i,pS={code:`en_GB`,langSubtag:`en`,isRtl:!1,sourceColumn:`en_GB`,label:`English`};function mS(e,t){return e.some(e=>fS.test(e.key)&&qx(t===`C`?e.translationC:e.translationD)!==``)}function hS(e,t,n){let r=dS.exec(qx(e));if(r){let e=r[1].toLowerCase();return{code:`${e}_${r[2].toUpperCase()}`,langSubtag:e,isRtl:cS(e),sourceColumn:t,label:uS(e)}}return mS(n,t)?{column:t,rawValue:qx(e)}:null}function gS(e,t){let n=[pS],r=[];for(let i of[`C`,`D`]){let a=hS(e.languageCountry[i],i,t);a!==null&&(`code`in a?n.push(a):r.push(a))}return{locales:n,unresolved:r}}var _S=`Complete Translations`,vS=/^\(\s*(single|multiple)\s+answers?\s*\)/i,yS=/^q\d+$/i,bS=/^a\d+$/i,xS=Jx(`Error Messages`);function SS(e){return(t,n)=>{t[e]={labelByLocale:n}}}var CS={[Jx(`headingBeforeBreak`)]:(e,t)=>{e.headingBeforeBreakByLocale=t},[Jx(`headingAfterBreak`)]:(e,t)=>{e.headingAfterBreakByLocale=t},[Jx(`requiredField`)]:(e,t)=>{e.requiredFieldNoteByLocale=t},[Jx(`countryCode`)]:SS(`countryCode`),[Jx(`email`)]:SS(`email`),[Jx(`firstName`)]:SS(`firstName`),[Jx(`lastName`)]:SS(`lastName`),[Jx(`callingCodeDropdownFirstEntry`)]:(e,t)=>{e.callingCode={labelByLocale:{},...e.callingCode,dropdownFirstEntryByLocale:t}},[Jx(`callingCode`)]:(e,t)=>{e.callingCode={dropdownFirstEntryByLocale:{},...e.callingCode,labelByLocale:t}},[Jx(`privacyPolicy (.com form only)`)]:(e,t)=>{e.privacyPolicy={linkUrlByLocale:{},...e.privacyPolicy,textByLocale:t}},[Jx(`url`)]:(e,t)=>{e.privacyPolicy={textByLocale:{},...e.privacyPolicy,linkUrlByLocale:t}},[Jx(`Marketing optin (.com form only)`)]:SS(`marketingOptin`),[Jx(`submitButton`)]:(e,t)=>{e.submitButton={labelByLocale:t}},[Jx(`Terms and Conditions`)]:(e,t)=>{e.termsAndConditions={urlByLocale:{},...e.termsAndConditions,textByLocale:t}},[Jx(`redirectAfterSuccessUrl`)]:(e,t)=>{e.redirectAfterSuccessUrlByLocale=t},[Jx(`Rafle Draw`)]:(e,t)=>{e.extraFieldsByLocale={...e.extraFieldsByLocale,"Rafle Draw":t}}},wS=new Map([[Jx(`heading`),`heading`],[Jx(`subHeading`),`subHeading`],[Jx(`subHeadingUrlText`),`subHeadingUrlText`],[Jx(`subHeadingUrl`),`subHeadingUrl`]]),TS=Jx(`Form Thank you Page`);function ES(e){let t=[],{locales:n,unresolved:r}=gS(e.meta,e.rows),i={};for(let e of n)e.sourceColumn===`C`&&(i.C=e.code),e.sourceColumn===`D`&&(i.D=e.code);let a=pS.code;function o(e){let t={[a]:e.englishText};return i.C&&e.translationC!==``&&(t[i.C]=e.translationC),i.D&&e.translationD!==``&&(t[i.D]=e.translationD),t}let s=[],c={submitButton:{labelByLocale:{}}},l={},u={},d={},f={},p=new Set,m=`fields`,h=null;function g(e,t,n){let r=e===`pageError`?l:u;for(let[e,i]of Object.entries(n))r[e]={...r[e],[t]:i}}function _(){if(!h)return;let e=h;h=null;let n=e.headingByLocale[a]??``;if(n===``||Yx(n)){t.push({severity:`warning`,sheet:_S,row:e.startRow,message:`Question ${e.id} looks like an unfilled placeholder (English text: "${n||`(empty)`}") and was excluded from the generated form.`});return}let r=e.controlType;e.answers.length===0?r=`text`:r===null&&(t.push({severity:`warning`,sheet:_S,row:e.startRow,message:`Question ${e.id} has no "(Single answer)"/"(Multiple answers)" marker row; defaulting to single-answer (radio).`}),r=`radio`),s.push({id:e.id,order:s.length+1,controlType:r,headingByLocale:e.headingByLocale,subheadingByLocale:e.subheadingByLocale,required:!0,answers:e.answers})}let v=e.rows.filter(t=>t.rowNumber>e.headerRowNumber);for(let e of v){let n=e.key,r=Jx(n);if(yS.test(n)){_(),p.has(r)&&t.push({severity:`error`,sheet:_S,row:e.rowNumber,message:`Duplicate question id "${n}" \u2014 a question with this id was already seen earlier in the sheet.`}),p.add(r),h={id:n,startRow:e.rowNumber,headingByLocale:o(e),subheadingByLocale:{},controlType:null,answers:[]};continue}if(bS.test(n)){if(!h){t.push({severity:`error`,sheet:_S,row:e.rowNumber,message:`Answer row "${n}" found with no preceding question row; skipped.`});continue}h.answers.push({id:n,order:h.answers.length+1,textByLocale:o(e)});continue}if(n===``){let t=vS.exec(e.englishText);if(t&&h&&h.answers.length===0){h.controlType=/multiple/i.test(t[1])?`checkbox`:`radio`,h.subheadingByLocale=o(e);continue}if(/^page error/i.test(e.englishText)){_(),m=`pageError`;continue}if(/^error messages/i.test(e.englishText)){_(),m=`validation`;continue}continue}if(r===TS){_(),m=`thankYou`;continue}if(r===xS){_(),m=`validation`;continue}if(m===`validation`&&r!==``){_();let t=o(e);for(let[e,n]of Object.entries(t))f[e]={...f[e],[r]:n};continue}if((m===`pageError`||m===`thankYou`)&&wS.has(r)){_(),g(m,wS.get(r),o(e));continue}let i=CS[r];if(i){_(),i(c,o(e));continue}_(),d[n]=o(e),t.push({severity:`warning`,sheet:_S,row:e.rowNumber,message:`Unrecognized row key "${n}" \u2014 its text was preserved but not mapped to a known field.`})}return _(),Object.keys(d).length>0&&(c.extraFieldsByLocale=d),{form:{meta:{subsidiary:e.meta.subsidiary.C||e.meta.subsidiary.D||``,sourceFileName:e.sourceFileName,defaultLocale:a},locales:n,questions:s,fields:c,validationMessages:f,pageError:l,thankYou:u},unresolvedLocales:r,issues:t}}var DS=`Complete Translations`,OS=/^[=+\-@]/;function kS(e,t){let n=[],r=[];for(let i of[...t,...e.issues])(i.severity===`error`?n:r).push(i);for(let t of e.unresolvedLocales)n.push({severity:`error`,sheet:DS,column:t.column,message:`Column ${t.column}'s "Language_Country" metadata could not be read (found "${t.rawValue||`(blank)`}"), but the column has real translated content. Confirm which language column ${t.column} is before generating.`});e.form.questions.length===0&&n.push({severity:`error`,sheet:DS,message:`No usable questions were found (every question row was empty or unfilled placeholder text).`}),e.form.fields.submitButton.labelByLocale[pS.code]||n.push({severity:`error`,sheet:DS,message:`No "submitButton" row/text was found; the generated form needs a submit button label.`});for(let t of e.form.questions){AS(t.headingByLocale,`Question ${t.id} heading`,r),jS(t.headingByLocale,`Question ${t.id} heading`,r);for(let e of t.answers)AS(e.textByLocale,`Question ${t.id} answer ${e.id}`,r),jS(e.textByLocale,`Question ${t.id} answer ${e.id}`,r)}return{errors:n,warnings:r}}function AS(e,t,n){for(let[r,i]of Object.entries(e))OS.test(i)&&n.push({severity:`warning`,sheet:DS,message:`${t} (${r}) starts with a formula-like character ("${i[0]}") \u2014 verify this is meant to be literal text and not a leftover Excel formula.`})}function jS(e,t,n){if(!(e[pS.code]??``).includes(`
`))for(let[r,i]of Object.entries(e))r!==pS.code&&i.includes(`
`)&&n.push({severity:`warning`,sheet:DS,message:`${t} (${r}) contains multiple lines but the English source is a single line \u2014 this may indicate several translations were pasted into one cell by mistake.`})}function MS(e,t,n){return e?e[t]??e[n]??``:``}var NS=xx(Fb(),Fb()),PS=Cx([`radio`,`checkbox`,`text`]),FS=hx({code:Fb(),langSubtag:Fb(),isRtl:sx(),sourceColumn:Cx([`en_GB`,`C`,`D`]),label:Fb()}),IS=hx({id:Fb(),order:rx(),textByLocale:NS,image:hx({src:Fb(),alt:Fb().optional()}).optional()}),LS=hx({id:Fb(),order:rx(),controlType:PS,headingByLocale:NS,subheadingByLocale:NS,required:sx(),answers:px(IS)}),RS=hx({labelByLocale:NS,placeholderByLocale:NS.optional()}),zS=RS.extend({dropdownFirstEntryByLocale:NS}),BS=hx({textByLocale:NS,linkUrlByLocale:NS}),VS=hx({textByLocale:NS,urlByLocale:NS}),HS=hx({email:RS.optional(),firstName:RS.optional(),lastName:RS.optional(),countryCode:RS.optional(),callingCode:zS.optional(),privacyPolicy:BS.optional(),marketingOptin:RS.optional(),termsAndConditions:VS.optional(),submitButton:RS,redirectAfterSuccessUrlByLocale:NS.optional(),headingBeforeBreakByLocale:NS.optional(),headingAfterBreakByLocale:NS.optional(),requiredFieldNoteByLocale:NS.optional(),extraFieldsByLocale:xx(Fb(),NS).optional()}),US=hx({heading:Fb().optional(),subHeading:Fb().optional(),subHeadingUrlText:Fb().optional(),subHeadingUrl:Fb().optional()}),WS=hx({requiredField:Fb().optional(),email:Fb().optional(),mobileNumber:Fb().optional(),modalMessage1:Fb().optional(),modalMessage2:Fb().optional(),modalButtonYes:Fb().optional(),modalButtonNo:Fb().optional()});hx({meta:hx({subsidiary:Fb(),sourceFileName:Fb(),defaultLocale:Fb()}),locales:px(FS),questions:px(LS),fields:HS,validationMessages:xx(Fb(),WS),pageError:xx(Fb(),US),thankYou:xx(Fb(),US)});var GS=`a,
abbr,
acronym,
address,
applet,
article,
aside,
audio,
b,
big,
blockquote,
body,
canvas,
caption,
center,
cite,
code,
dd,
del,
details,
dfn,
div,
dl,
dt,
em,
embed,
fieldset,
figcaption,
figure,
footer,
form,
h1,
h2,
h3,
h4,
h5,
h6,
header,
hgroup,
html,
i,
iframe,
img,
input,
ins,
kbd,
label,
legend,
li,
mark,
menu,
nav,
object,
ol,
output,
p,
pre,
q,
ruby,
s,
samp,
section,
small,
span,
strike,
strong,
sub,
summary,
sup,
table,
tbody,
td,
tfoot,
th,
thead,
time,
tr,
tt,
u,
ul,
var,
video {
    border: 0;
    font-size: 100%;
    font: inherit;
    margin: 0;
    padding: 0;
    vertical-align: baseline;
}

input::-ms-clear,
input::-ms-reveal {
    display: none;
}

input::-webkit-search-cancel-button,
input::-webkit-search-decoration,
input::-webkit-search-results-button,
input::-webkit-search-results-decoration {
    display: none;
}

input::-webkit-inner-spin-button,
input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type='number'] {
    -moz-appearance: textfield;
}

article,
aside,
details,
figcaption,
figure,
footer,
header,
hgroup,
menu,
nav,
section {
    display: block;
}

body {
    line-height: 1;
}

#hrTy {
    position: relative;
    margin-top: 20px;
    padding: 20px;
    font-family: 'SamsungSS Body Regular'
}

#hrTy h3 {
    font-family: 'SamsungSS Head Bold'
}

ol,
ul {
    list-style: none;
}

blockquote,
q {
    quotes: none;
}

blockquote:after,
blockquote:before,
q:after,
q:before {
    content: '';
    content: none;
}

table {
    border-collapse: collapse;
    border-spacing: 0;
}

.b_400,
.b_767,
.b_850 {
    display: none;
}

body,
html {
    color: #000;
    font-family: 'SamsungSS Head Light';
    font-weight: normal;
}

.container {
    margin: 0 auto;
    max-width: 1160px;
    padding: 0px 0;
    width: 95%;
}
.container_oc {
    margin: 0 auto;
    max-width: 1160px;
    padding: 88px 0;
    width: 95%;
}
.top_cont {
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: center;
}

.top_cont h2 {
    font-family: 'SamsungSS Head Bold';
    font-size: 32px;
    line-height: 1.1;
}

.top_cont p {
    font-family: 'SamsungSS Body Regular';
    font-size: 14px;
    line-height: 1.3;
}

.star {
    color: #006BEA;
}

.main {
    margin-top: 64px;
}

.main form {
    display: flex;
    flex-direction: column;
    gap: 96px;
}

.form_top_group {
    display: flex;
    flex-direction: column;
    font-family: 'SamsungSS Body Regular';
    gap: 48px;
}

.form_text_bx {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    gap: 3px;
    width: 100%;
}

.form_label {
    color: #555555;
    line-height: 19px;
}

.form_top_group input,
.form_top_group select {
    border: none;
    border-bottom: 1px solid #555555;
    font-family: 'SamsungSS Body Regular';
    font-size: 18px;
    line-height: 24px;
    padding: 7px 0px;
    width: 100%;
}

.form_top_group input::placeholder {
    color: #9b9b9b;
    font-size: 18px;
    line-height: 24px;
}

.input_wrap {
    position: relative;
    width: 100%;
}

.input_wrap .btn_clear {
    background: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23999999'%20stroke-width='2'%20stroke-linecap='round'%3E%3Cline%20x1='6'%20y1='6'%20x2='18'%20y2='18'/%3E%3Cline%20x1='18'%20y1='6'%20x2='6'%20y2='18'/%3E%3C/svg%3E") no-repeat center center /contain;
    border: none;
    cursor: pointer;
    height: 16px;
    outline: none;
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
}

.form_text_group {
    display: flex;
    gap: 16px;
}

.form_text_bx.select_bx .select_wrap {
    display: flex;
    gap: 16px;
}

.form_text_bx.select_bx .select_wrap select {
    width: 255px;
}

.form_text_bx.select_bx .select_wrap .input_wrap {
    width: calc(100% - 248px - 16px);
}

.form_check_group {
    display: flex;
    flex-direction: column;
    gap: 96px;
}

.form_check_module {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form_check_title {
    align-items: center;
    display: flex;
    gap: 5px;
}

.form_check_title h3 {
    font-size: 24px;
    font-family: 'SamsungSS Head Bold';
    word-break: break-all;
}

.form_check_title p {
    font-size: 14px;
    line-height: 19px;
}

.radio_group {
    align-items: center;
    display: flex;
    gap: 225px;
}

.radio_wrap {
    align-items: center;
    display: flex;
    gap: 8px;
}

.radio_wrap input {
    accent-color: #2189FF;
    cursor: pointer;
    flex-shrink: 0;
    height: 22px;
    min-height: 22px;
    min-width: 22px;
    width: 22px;
}

.radio_wrap label {
    align-items: center;
    cursor: pointer;
    display: flex;
    font-size: 14px;
    line-height: 19px;
    padding-top: 2px;
}

.form_check_list_wrap .radio_wrap {
    justify-self: start;
    align-self: start;
}

.form_check_list_wrap {
    column-gap: 24px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    row-gap: 40px;
	flex-wrap: wrap;
}

.form_check_list {
    align-items: center;
    display: flex;
    gap: 8px;
}

.form_check_list input {
    accent-color: #2189FF;
    cursor: pointer;
    height: 22px;
    width: 22px;
}

.form_check_list label {
    align-items: center;
    cursor: pointer;
    display: flex;
    gap: 8px;
}

.form_check_list label img {
    height: 80px;
    width: 80px;
}

.form_check_list label p {
    font-size: 14px;
    line-height: 19px;
    white-space: nowrap;
}

.form_bottom_group {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form_bottom_check_group {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form_bottom_check {
    font-size: 14px;
    line-height: 19px;
}
.form_bottom_img
{
    width: 14px;
}
.form_bottom_check input[type="checkbox"] {
    display: none;
}

.form_bottom_check label {
    cursor: pointer;
    display: block;
    padding-left: 32px;
    position: relative;
}

.form_bottom_check label::after {
    background: #fff;
    border: 1px solid #555;
    border-radius: 50%;
    content: '';
    height: 24px;
    left: 0;
    position: absolute;
    top: 0;
    width: 24px;
}

.form_bottom_check2 label::after {
    top: 50%;
    transform: translateY(-50%);
}

.form_bottom_check input[type="checkbox"]:checked~label::after {
    background-color: #006BEA;
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='3'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpolyline%20points='5%2013%2010%2018%2019%207'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 60%;
    border: none;
}

.form_bottom_check label a {
    color: #006BEA;
    display: inline-block;
}

.form_bottom_check label img {
    height: 14px;
    width: 14px;
}

.form_bottom_group button {
    background-color: #ccc;
    cursor: not-allowed;
    align-items: center;
    border-radius: 50px;
    border: none;
    color: #fff;
    display: flex;
    font-family: 'SamsungSS Body Bold';
    font-size: 14px;
    height: 40px;
    justify-content: center;
    margin: 0 auto;
    width: 146px;
}

.form_bottom_group button:hover {
    border: 1px solid black;
}

.form_bottom_group button:enabled {
    background-color: #000;
    color: #fff;
    cursor: pointer;
}

.form_bottom_group button:enabled:hover {
    background-color: #fff;
    border: 1px solid black;
    color: #000;
    cursor: pointer;
}
/* Floating bar container (OC form) */
.form_bottom_bar {
    align-items: center;
    background: #fff;
    bottom: 0;
    border-radius: 0;
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.15);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 8px;
    left: 0;
    padding: 16px 24px;
    position: fixed;
    width: 100%;
    z-index: 100;
}

.form_bottom_bar button {
    background-color: #ccc;
    cursor: not-allowed;
    align-items: center;
    border-radius: 50px;
    border: none;
    color: #fff;
    display: flex;
    font-family: 'SamsungSS Body Bold';
    font-size: 14px;
    height: 40px;
    justify-content: center;
    margin: 0 auto;
    width: 146px;
}

.form_bottom_bar button:hover {
    border: 1px solid black;
}

.form_bottom_bar button:enabled {
    background-color: #000;
    border: 1px solid #fff;
    color: #fff;
    cursor: pointer;
}

.form_bottom_bar button:enabled:hover {
    background-color: #000;
    border: 1px solid #fff;
    color: #fff;
    cursor: pointer;
}

@media (prefers-color-scheme: dark) {
    .form_bottom_bar button:enabled {
        background-color: #fff !important;
        border: 1px solid #000 !important;
        color: #000 !important;
    }
    .form_bottom_bar button:enabled:hover {
        background-color: #000 !important;
        border: 1px solid #fff !important;
        color: #fff !important;
    }
}

.form_bottom_terms {
    font-size: 12px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
}

.form_bottom_terms:hover {
    text-decoration: underline;
}


/* Modal popup (loaded from modal.html on submit) */
.fullform-submit-intent-popup {
    align-items: center;
    display: none;
    inset: 0;
    justify-content: center;
    padding: 16px;
    position: fixed;
    z-index: 2000;
}

.fullform-submit-intent-popup.is-active {
    display: flex;
}

.fullform-submit-intent-popup .popup__dimmed {
    background: rgba(0, 0, 0, 0.55);
    inset: 0;
    position: absolute;
}

.fullform-submit-intent-popup .popup__contents-wrap {
    max-width: 380px;
    position: relative;
    width: 100%;
    z-index: 1;
}

.fullform-submit-intent-popup .popup__contents {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
    font-family: 'SamsungSS Body Regular';
    padding: 28px 24px;
    position: relative;
    text-align: center;
}

.fullform-submit-intent-popup .popup__desc {
    color: #000;
    font-size: 16px;
    line-height: 1.5;
    margin: 0;
}

.fullform-submit-intent-popup .popup__btn-wrap {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
}

.fullform-submit-intent-popup .cta {
    border-radius: 999px;
    cursor: pointer;
    font-family: 'SamsungSS Body Bold';
    font-size: 14px;
    min-width: 96px;
    padding: 10px 16px;
}

.fullform-submit-intent-popup .cta--outlined {
    background: #fff;
    border: 1px solid #000;
    color: #000;
}

.fullform-submit-intent-popup .cta--contained {
    background: #000;
    border: 1px solid #000;
    color: #fff;
}

.fullform-submit-intent-popup .popup__close {
    background: transparent;
    border: none;
    cursor: pointer;
    position: absolute;
    right: 12px;
    top: 12px;
}

body.popup-open {
    overflow: hidden;
}


.g-recaptcha {
    height: 76px;
    width: 302px;
}

.blank {
    align-items: flex-end;
    background-color: #000;
    display: flex;
    display: inline-block;
    height: 2px;
    width: 100px;
}

.underline {
    display: inline;
    overflow-wrap: break-word;
    text-decoration: underline;
    word-break: break-all;
}

@media screen and (max-width:1150px) {
    .form_check_module3 .form_check_title {
        align-items: flex-start;
        flex-direction: column;
        gap: 3px;
    }
}

@media screen and (max-width:1050px) {
    .form_check_list label img {
        height: 48px;
        width: 48px;
    }

    .form_check_list input {
        height: 20px;
        width: 20px;
    }

    .form_check_list_wrap {
        grid-template-columns: repeat(3, 1fr);
    }

    .form_check_title {
        align-items: flex-start;
        display: block;
        flex-direction: column;
        gap: 3px;
    }

    .form_check_title h3 {
        display: inline;
        font-size: 20px;
        line-height: 26px;
        word-break: keep-all;
    }

    .form_check_title p {
        display: inline-block;
        font-size: 12px;
        padding-left: 3px;
        word-break: keep-all;
    }

    .underline {
        word-break: break-all;
    }
}

@media screen and (max-width:850px) {
    .b_850 {
        display: block;
    }

    .n_850 {
        display: none;
    }

    .top_cont h2 {
        font-size: 22px;
        line-height: 29px;
    }

    .top_cont p {
        font-size: 12px;
    }

    .form_check_list_wrap {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media screen and (max-width:767px) {
    .b_767 {
        display: block;
    }

    .container {
        box-sizing: border-box;
        padding: 0px 24px;
        width: 100%;
    }

	.container_oc {
		margin: 0 auto;
		max-width: 1160px;
		padding: 88px 0;
		width: 95%;
	}
    .main {
        margin-top: 48px;
    }

    .form_top_group input,
    .form_top_group select {
        font-size: 14px;
        padding: 0 0 7px;
    }

    .form_top_group input::placeholder {
        color: #9b9b9b;
        font-size: 14px;
    }

    .input_wrap .btn_clear {
        top: 3px;
        transform: translateY(0);
    }

    .form_top_group {
        gap: 38px;
    }

    .form_text_group {
        flex-direction: column;
        gap: 38px;
    }

    .main form {
        gap: 54px;
    }

    .form_label {
        font-size: 12px;
    }

    .radio_group {
        align-items: flex-start;
        flex-direction: column;
        gap: 16px;
    }

    .form_check_group {
        gap: 64px;
    }

    .form_check_list_wrap {
        display: flex;
        flex-direction: column;
        row-gap: 16px;
    }

    .form_bottom_check2 label::after {
        top: 0;
        transform: translateY(0);
    }

    .form_text_bx.select_bx .select_wrap .input_wrap,
    .form_text_bx.select_bx .select_wrap select {
        width: 100%;
    }

    .form_bottom_check label::after {
        height: 20px;
        width: 20px;
    }

    .form_bottom_check label {
        padding-left: 28px;
    }
}

@media screen and (max-width:400px) {
    .g-recaptcha {
        margin: 0 auto;
    }

    .b_400 {
        display: block;
    }
}

.error,
.parsley-custom-error-message,
.parsley-length,
.parsley-required,
.parsley-requiredIf,
.parsley-type,
.parsley-mobileNumberByCountry {
    color: red;
    font-size: 12px;
    padding: 4px;
}

#overlay {
    background-color: rgba(0, 0, 0, 0.5);
    bottom: 0;
    cursor: not-allowed;
    display: none;
    height: 100%;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    width: 100%;
    z-index: 2;
}

.loader {
    -ms-transform: translate(-50%, -50%);
    animation: pulse 1s linear infinite;
    border-radius: 50%;
    border: 5px solid #FFF;
    box-sizing: border-box;
    color: white;
    display: inline-block;
    font-size: 50px;
    height: 48px;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
}

.loader:after {
    animation: scaleUp 1s linear infinite;
    border-radius: 50%;
    border: 5px solid #FFF;
    box-sizing: border-box;
    content: '';
    display: inline-block;
    height: 48px;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
}

@keyframes scaleUp {
    0% {
        transform: translate(-50%, -50%) scale(0);
    }

    60%,
    100% {
        transform: translate(-50%, -50%) scale(1);
    }
}

@keyframes pulse {

    0%,
    60%,
    100% {
        transform: scale(1);
    }

    80% {
        transform: scale(1.2);
    }
}




/* modal popup */
@media only screen and (max-width:767px) {
    .co70-hand-raiser__alert-popup .popup__contents {
        padding: 6.66666667vw 0
    }
}


.popup-video {
    display: none
}

.popup-video--show {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    z-index: 3100
}

.popup-video__dimmed {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: #000;
    opacity: .9
}

.popup-video__video-wrap {
    position: relative;
    z-index: 3100
}

.popup-video__video-wrap .video {
    display: none;
    width: 100%;
    height: 100%
}

.popup-video__btn-video-close {
    position: fixed;
    display: inline-block;
    z-index: 3100;
    top: 24px;
    right: 24px;
    width: 36px;
    height: 36px;
    font-size: 0
}

.popup-video__btn-video-close svg {
    width: 100%;
    height: 100%;
    fill: #fff
}

@media only screen and (min-width:768px) and (max-width:1440px) {
    .popup-video__btn-video-close {
        top: 1.66666667vw;
        right: 1.66666667vw;
        width: 2.5vw;
        height: 2.5vw
    }
}

@media only screen and (max-width:767px) {
    .popup-video__btn-video-close {
        top: 6.66666667vw;
        right: 6.66666667vw;
        width: 6.66666667vw;
        height: 6.66666667vw
    }
}

.popup {
    position: fixed;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3100;
    visibility: hidden;
    opacity: 0;
    pointer-events: none
}

.popup--open {
    visibility: visible;
    opacity: 1;
    pointer-events: auto
}

.popup__dimmed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    opacity: .75;
    z-index: -1
}

.popup__contents {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    position: relative;
    width: 100%;
    max-height: 100%;
    background-color: #fff;
    border-radius: 24px;
    margin: auto 0 100 0;
    padding: 24px 0;
    overflow: hidden
}

.popup__contents-wrap {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    width: 684px;
    height: 100%;
    font-size: 0;
    padding: 30px 0;
    line-height: 1.33
}

.popup--alert .popup__contents-wrap {
    width: 448px
}

.popup__title {
    font-family: 'SamsungSS Head Regular', arial, sans-serif;
    font-size: 24px;
    font-weight: bold;
    padding: 0 56px 16px 24px
}

.popup__icon {
    text-align: center;
    padding-bottom: 16px
}

.popup__icon .icon {
    display: inline-block;
    width: 48px;
    height: 48px
}

.popup__inner {
    padding: 0 24px
}

.popup__inner-wrap {
    margin-top: 32px;
    min-height: 0;
    overflow: auto
}

.popup--alert .popup__inner-wrap {
    margin-bottom: 32px
}

.popup__title+.popup__inner-wrap,
.popup__icon+.popup__inner-wrap {
    margin-top: 0
}

.popup__desc {
    font-family: 'SamsungSS Body Regular', 'SamsungOne', arial, sans-serif;
    font-weight: normal;
    font-size: 18px;
}

.popup__contents {
    padding: 24px;
}

.popup__desc--align-center {
    text-align: center
}

.popup__desc--align-left {
    text-align: left
}

.popup__desc--align-right {
    text-align: right
}

.popup__btn-wrap {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    position: relative;
    padding: 24px 24px 0 24px;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center
}

.popup--alert .popup__btn-wrap {
    margin-top: -32px
}

.popup__btn-wrap .cta {
    width: 212px
}

.popup__btn-wrap .cta:nth-of-type(2) {
    margin-left: 20px
}

.popup--alert .popup__btn-wrap .cta {
    width: 190px
}

.popup--alert .popup__btn-wrap .cta:nth-of-type(2) {
    margin-left: auto
}

.popup--alert .popup__btn-wrap .cta:only-of-type {
    width: 298px
}

.popup__close {
    position: absolute;
    top: 24px;
    right: 24px;
    width: 24px;
    height: 24px
}

.popup__close .icon {
    width: 100%;
    height: 100%
}

.popup .scrollbar-vertical__track {
    right: 4px
}


@media only screen and (max-width:767px) {
    .popup__contents-wrap {
        width: 100%;
        padding: 0
    }

    .popup__desc {
        font-size: 14px;
    }
    .popup--alert .popup__contents-wrap {
        padding: 8.33333333vw 0vw;
        width: 86.66666667vw
    }

    .popup--alert .popup__contents {
        -webkit-box-flex: 0;
        -ms-flex-positive: 0;
        flex-grow: 0;
        border-radius: 12px;
    }

    .popup__title {
        font-size: 6.11111111vw;
        padding: 0vw 15.55555556vw 4.44444444vw 6.66666667vw
    }

    .popup__icon {
        padding-bottom: 4.44444444vw
    }

    .popup__icon .icon {
        width: 13.33333333vw;
        height: 13.33333333vw
    }

    .popup__inner {
        padding: 0vw 6.66666667vw
    }

    .popup__inner-wrap {
        margin-top: 8.88888889vw;
        -webkit-box-flex: 1;
        -ms-flex-positive: 1;
        flex-grow: 1
    }

    .popup--alert .popup__inner-wrap {
        -webkit-box-flex: 0;
        -ms-flex-positive: 0;
        flex-grow: 0;
        margin-bottom: 8.88888889vw
    }

    .popup__btn-wrap {
        padding: 6.66666667vw
    }

    .popup--alert .popup__btn-wrap {
        margin-top: -8.88888889vw
    }

    .popup__btn-wrap .cta {
        width: 40.55555556vw
    }

    .popup__btn-wrap .cta:nth-of-type(2) {
        margin-left: auto
    }

    .popup--alert .popup__btn-wrap .cta {
        width: 33.88888889vw
    }

    .popup--alert .popup__btn-wrap .cta:nth-of-type(2) {
        margin-left: auto
    }

    .popup--alert .popup__btn-wrap .cta:only-of-type {
        width: 100%
    }

    .popup--alert .popup__btn--dir-vertical {
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
        -ms-flex-direction: column;
        flex-direction: column
    }

    .popup--alert .popup__btn--dir-vertical .cta {
        width: 100%
    }

    .popup--alert .popup__btn--dir-vertical .cta:first-of-type {
        -webkit-box-ordinal-group: 2;
        -ms-flex-order: 1;
        order: 1
    }

    .popup--alert .popup__btn--dir-vertical .cta:nth-of-type(2) {
        -webkit-box-ordinal-group: 1;
        -ms-flex-order: 0;
        order: 0;
        margin-bottom: 2.22222222vw
    }

    .popup__close {
        top: 6.66666667vw;
        right: 6.66666667vw;
        width: 6.66666667vw;
        height: 6.66666667vw
    }

    .popup .scrollbar-vertical__track {
        right: 1.11111111vw
    }

}

/* modal button*/
.popup--alert button {
    border: 0;
    margin: 0;
    padding: 0;
    width: auto;
    overflow: visible;
    background: 0;
    text-align: inherit;
    border-radius: 0;
    cursor: pointer;
    color: inherit;
    font: inherit;
    line-height: normal;
    -webkit-font-smoothing: inherit;
    -moz-osx-font-smoothing: inherit;
    -webkit-appearance: none
}

.popup--alert .cta {
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    position: relative;
    vertical-align: middle;
    -webkit-transition-property: color, background-color, border-color, border-bottom-color;
    transition-property: color, background-color, border-color, border-bottom-color;
    -webkit-transition-duration: .2s;
    transition-duration: .2s;
    -webkit-transition-timing-function: cubic-bezier(0.33, 0, 0.3, 1);
    transition-timing-function: cubic-bezier(0.33, 0, 0.3, 1);
    font-family: 'SamsungSS Body Bold', 'SamsungOne', arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    line-height: 19px;
    white-space: nowrap
}

.popup--alert .cta--contained {
    padding: 9px 23px 10px 23px;
    border-radius: 20px;
    border-width: 1px;
    border-style: solid;
    border-color: transparent
}

.popup--alert .cta--contained.cta--black {
    border-color: transparent !important;
    color: #fff !important;
    background-color: #000 !important
}

.popup--alert .cta--contained.cta--black:active {
    opacity: .7 !important
}

.popup--alert .cta--contained.cta--black:not(:has(.icon)):not([target="_blank"]):hover,
.cta--contained.cta--black:not(:has(.icon)):not([target="_blank"]):focus {
    border-color: #000 !important;
    color: #000 !important;
    background-color: #fff !important
}

.popup--alert .cta--contained.cta--black.cta--disabled {
    color: #fff !important;
    background-color: #000 !important;
    cursor: default !important;
    opacity: .2 !important
}

.popup--alert .cta--contained.cta--black.cta--disabled:hover,
.cta--contained.cta--black.cta--disabled:focus {
    color: #fff !important;
    background-color: #000 !important
}

.popup--alert .cta--contained.cta--black[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--contained.cta--white {
    border-color: transparent !important;
    color: #000 !important;
    background-color: #fff !important
}

.popup--alert .cta--contained.cta--white:active {
    opacity: .7 !important
}

.popup--alert .cta--contained.cta--white:not(:has(.icon)):not([target="_blank"]):hover,
.cta--contained.cta--white:not(:has(.icon)):not([target="_blank"]):focus {
    border-color: #fff !important;
    color: #fff !important;
    background-color: #000 !important
}

.popup--alert .cta--contained.cta--white.cta--disabled {
    color: #000 !important;
    background-color: #fff !important;
    cursor: default !important;
    opacity: .2 !important
}

.popup--alert .cta--contained.cta--white.cta--disabled:hover,
.cta--contained.cta--white.cta--disabled:focus {
    color: #000 !important;
    background-color: #fff !important
}

.popup--alert .cta--contained.cta--white[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--contained.cta--emphasis {
    border-color: #2189ff !important;
    color: #fff !important;
    background-color: #2189ff !important
}

.popup--alert .cta--contained.cta--emphasis:active {
    opacity: .7 !important
}

.popup--alert .cta--contained.cta--emphasis:not(:has(.icon)):not([target="_blank"]):hover,
.cta--contained.cta--emphasis:not(:has(.icon)):not([target="_blank"]):focus {
    color: #006bea !important;
    background-color: #fff !important
}

.popup--alert .cta--contained.cta--emphasis.cta--disabled {
    border-color: #2189ff !important;
    color: #fff !important;
    background-color: #2189ff !important;
    cursor: default !important;
    text-shadow: none !important;
    opacity: .2 !important
}

.popup--alert .cta--contained.cta--emphasis.cta--disabled:hover,
.cta--contained.cta--emphasis.cta--disabled:focus {
    border-color: #2189ff !important;
    color: #fff !important;
    background-color: #2189ff !important
}

.popup--alert .cta--contained.cta--emphasis[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--outlined {
    padding: 9px 23px 10px 23px;
    border-radius: 20px;
    border-width: 1px;
    border-style: solid
}

.popup--alert .cta--outlined.cta--black {
    color: #000 !important;
    background-color: transparent !important;
    border-color: #000 !important
}

.popup--alert .cta--outlined.cta--black:active {
    opacity: .7 !important
}

.popup--alert .cta--outlined.cta--black:not(:has(.icon)):not([target="_blank"]):hover,
.cta--outlined.cta--black:not(:has(.icon)):not([target="_blank"]):focus {
    color: #fff !important;
    background-color: #000 !important
}

.popup--alert .cta--outlined.cta--black.cta--disabled {
    color: #ddd !important;
    border-color: #ddd !important;
    cursor: default !important
}

.popup--alert .cta--outlined.cta--black.cta--disabled:hover,
.cta--outlined.cta--black.cta--disabled:focus {
    color: #ddd !important;
    background-color: transparent !important;
    border-color: #ddd !important
}

.popup--alert .cta--outlined.cta--black[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--outlined.cta--black[target="_blank"].cta--disabled:before,
.cta--outlined.cta--black[target="_blank"].cta--disabled:hover:before,
.cta--outlined.cta--black[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23999999'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--outlined.cta--white {
    color: #fff !important;
    background-color: transparent !important;
    border-color: #fff !important
}

.popup--alert .cta--outlined.cta--white:active {
    opacity: .7 !important
}

.popup--alert .cta--outlined.cta--white:not(:has(.icon)):not([target="_blank"]):hover,
.cta--outlined.cta--white:not(:has(.icon)):not([target="_blank"]):focus {
    color: #000 !important;
    background-color: #fff !important
}

.popup--alert .cta--outlined.cta--white.cta--disabled {
    color: #555 !important;
    border-color: #555 !important;
    cursor: default !important
}

.popup--alert .cta--outlined.cta--white.cta--disabled:hover,
.cta--outlined.cta--white.cta--disabled:focus {
    color: #555 !important;
    background-color: transparent !important;
    border-color: #555 !important
}

.popup--alert .cta--outlined.cta--white[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--outlined.cta--white[target="_blank"].cta--disabled:before,
.cta--outlined.cta--white[target="_blank"].cta--disabled:hover:before,
.cta--outlined.cta--white[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23cccccc'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline {
    padding: 10px 0 11px 0
}

.popup--alert .cta--underline:after {
    content: ' ';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    height: 2px;
    background-color: currentColor
}

.popup--alert .cta--underline:hover:after,
.cta--underline:focus:after {
    -webkit-animation: cta-underline-animation .2s both;
    animation: cta-underline-animation .2s both;
    -webkit-animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-animation-delay: .1s;
    animation-delay: .1s
}

.popup--alert .cta--underline.cta--black {
    color: #000 !important
}

.popup--alert .cta--underline.cta--black.cta--disabled {
    color: #ddd !important;
    cursor: default !important
}

.popup--alert .cta--underline.cta--black[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline.cta--black[target="_blank"].cta--disabled:before,
.cta--underline.cta--black[target="_blank"].cta--disabled:hover:before,
.cta--underline.cta--black[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23999999'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline.cta--white {
    color: #fff !important
}

.popup--alert .cta--underline.cta--white.cta--disabled {
    color: #555 !important;
    cursor: default !important
}

.popup--alert .cta--underline.cta--white[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline.cta--white[target="_blank"].cta--disabled:before,
.cta--underline.cta--white[target="_blank"].cta--disabled:hover:before,
.cta--underline.cta--white[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23cccccc'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline-v2 {
    padding: 10px 0 11px 0
}

.popup--alert .cta--underline-v2:after {
    content: ' ';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    height: 1px;
    background-color: currentColor
}

.popup--alert .cta--underline-v2:hover:after,
.cta--underline-v2:focus:after {
    -webkit-animation: cta-underline-on-animation .35s cubic-bezier(0.35, 0, 0.36, 1) .2s;
    animation: cta-underline-on-animation .35s cubic-bezier(0.35, 0, 0.36, 1) .2s
}

.popup--alert .cta--underline-v2:active {
    opacity: .7
}

.popup--alert .cta--underline-v2.cta--large {
    padding: 9px 0 10px 0;
    font-size: 16px
}

.popup--alert .cta--underline-v2.cta--large:after {
    bottom: 6px
}

.popup--alert .cta--underline-v2.cta--dense {
    padding: 11px 0 12px 0
}

.popup--alert .cta--underline-v2.cta--dense:after {
    bottom: 4px
}

.popup--alert .cta--underline-v2.cta--black {
    color: #000 !important
}

.popup--alert .cta--underline-v2.cta--black.cta--disabled {
    color: #ddd !important;
    cursor: default !important
}

.popup--alert .cta--underline-v2.cta--black[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline-v2.cta--black[target="_blank"].cta--disabled:before,
.cta--underline-v2.cta--black[target="_blank"].cta--disabled:hover:before,
.cta--underline-v2.cta--black[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23999999'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline-v2.cta--white {
    color: #fff !important
}

.popup--alert .cta--underline-v2.cta--white.cta--disabled {
    color: #555 !important;
    cursor: default !important
}

.popup--alert .cta--underline-v2.cta--white[target="_blank"]:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--underline-v2.cta--white[target="_blank"].cta--disabled:before,
.cta--underline-v2.cta--white[target="_blank"].cta--disabled:hover:before,
.cta--underline-v2.cta--white[target="_blank"].cta--disabled:focus:before {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23cccccc'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M18%2013v6a2%202%200%200%201-2%202H5a2%202%200%200%201-2-2V8a2%202%200%200%201%202-2h6'/%3E%3Cpolyline%20points='15%203%2021%203%2021%209'/%3E%3Cline%20x1='10'%20y1='14'%20x2='21'%20y2='3'/%3E%3C/svg%3E") !important
}

.popup--alert .cta--label.cta--black {
    color: #000 !important
}

.popup--alert .cta--label.cta--black:hover,
.cta--label.cta--black:focus {
    color: #555 !important
}

.popup--alert .cta--label.cta--black.cta--disabled {
    color: #ddd !important;
    cursor: default !important
}

.popup--alert .cta--label.cta--black.cta--disabled:hover,
.cta--label.cta--black.cta--disabled:focus {
    color: #ddd !important
}

.popup--alert .cta--label.cta--white {
    color: #fff !important
}

.popup--alert .cta--label.cta--white:hover,
.cta--label.cta--white:focus {
    color: #ddd !important
}

.popup--alert .cta--label.cta--white.cta--disabled {
    color: #555 !important;
    cursor: default !important
}

.popup--alert .cta--label.cta--white.cta--disabled:hover,
.cta--label.cta--white.cta--disabled:focus {
    color: #555 !important
}

.popup--alert .cta--dense {
    padding: 8px 16px;
    border-radius: 16px;
    font-size: 12px;
    line-height: 16px
}

.popup--alert .cta--dense.cta--outlined {
    padding: 7px 15px
}

.popup--alert .cta--dense.cta--underline-v2 {
    padding: 7px 0;
    border-radius: 0
}

.popup--alert .cta.cta--2line {
    white-space: normal;
    text-align: center;
    line-height: 1.33;
    border-radius: 100px
}

.popup--alert .cta.cta--2line.cta--contained {
    padding-top: 5px;
    padding-bottom: 5px;
    min-height: 40px
}

.popup--alert .cta.cta--2line:not(.cta--icon-v2).cta--contained {
    padding-left: 16px;
    padding-right: 16px
}

.popup--alert .cta.cta--2line.cta--outlined {
    padding-top: 8px;
    padding-bottom: 8px;
    min-height: 40px
}

.popup--alert .cta.cta--2line:not(.cta--icon-v2).cta--outlined {
    padding-left: 15px;
    padding-right: 15px
}

.popup--alert .cta.cta--2line.cta--contained.cta--dense {
    padding-top: 8px;
    padding-bottom: 8px;
    min-height: 32px
}

.popup--alert .cta.cta--2line.cta--outlined.cta--dense {
    padding-top: 7px;
    padding-bottom: 7px;
    min-height: 32px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon):before {
    content: ' ';
    position: absolute;
    width: 16px;
    height: 16px;
    right: 24px;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
    top: 50%;
    background-repeat: no-repeat;
    background-size: 100% 100%
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--contained,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--outlined {
    padding-right: 49px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--contained::before,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--outlined::before {
    width: 18px;
    height: 18px;
    right: 23px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline-v2 {
    padding-right: 20px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline[target="_blank"]:before,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline-v2[target="_blank"]:before {
    right: 0
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline[target="_blank"]:after,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--underline-v2[target="_blank"]:after {
    display: none
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--dense:before,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--2line:before {
    right: 16px
}

.popup--alert .cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--dense.cta--contained,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--2line.cta--contained,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--dense.cta--outlined,
.cta[target="_blank"]:not(.cta--icon-v2):not(.cta--icon).cta--2line.cta--outlined {
    padding-right: 42px
}

.popup--alert .cta.cta--icon .icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    -ms-flex-negative: 0;
    flex-shrink: 0;
    margin-left: 4px;
    -webkit-box-sizing: content-box;
    box-sizing: content-box;
    fill: currentColor;
    -webkit-transition: fill .2s cubic-bezier(0.33, 0, 0.3, 1);
    transition: fill .2s cubic-bezier(0.33, 0, 0.3, 1)
}

.popup--alert .cta.cta--icon-leading .icon {
    -webkit-box-ordinal-group: 0;
    -ms-flex-order: -1;
    order: -1;
    margin-left: 0;
    margin-right: 4px
}

.popup--alert .cta.cta--icon:before {
    display: none
}

.popup--alert .cta.cta--icon.cta--contained,
.cta.cta--icon.cta--outlined {
    padding-right: 23px
}

.popup--alert .cta.cta--icon.cta--contained .icon,
.cta.cta--icon.cta--outlined .icon {
    width: 18px;
    height: 18px;
    margin-left: 8px
}

.popup--alert .cta.cta--icon.cta--underline,
.cta.cta--icon.cta--underline-v2 {
    padding-right: 0
}

.popup--alert .cta.cta--icon.cta--underline:after,
.cta.cta--icon.cta--underline-v2:after {
    display: none
}

.popup--alert .cta.cta--icon.cta--underline .icon,
.cta.cta--icon.cta--underline-v2 .icon {
    margin-bottom: 1px
}

.popup--alert .cta.cta--icon.cta--label .icon {
    margin-bottom: 1px
}

.popup--alert .cta.cta--icon.cta--icon-leading.cta--contained .icon,
.cta.cta--icon.cta--icon-leading.cta--outlined .icon {
    margin-left: 0;
    margin-right: 8px
}

.popup--alert .cta.cta--icon.cta--dense.cta--contained,
.cta.cta--icon.cta--2line.cta--contained {
    padding-right: 16px
}

.popup--alert .cta.cta--icon.cta--dense.cta--outlined,
.cta.cta--icon.cta--2line.cta--outlined {
    padding-right: 15px
}

.popup--alert .cta.cta--icon.cta--dense.cta--contained,
.cta.cta--icon.cta--dense.cta--outlined {
    padding-block: 7px
}

.popup--alert .cta.cta--icon-v2 .icon {
    display: inline-block;
    width: 18px;
    height: 18px;
    -ms-flex-negative: 0;
    flex-shrink: 0;
    -webkit-box-sizing: content-box;
    box-sizing: content-box;
    -webkit-transition: opacity .2s;
    transition: opacity .2s;
    fill: currentColor !important
}

.popup--alert .cta.cta--icon-v2 .icon--prefix {
    position: absolute;
    margin-left: -24px;
    opacity: 0
}

.popup--alert .cta.cta--icon-v2 .icon--suffix {
    opacity: 1
}

.popup--alert .cta.cta--icon-v2 .cta--inner {
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    gap: 8px;
    position: relative;
    -webkit-transition: left .2s cubic-bezier(0.35, 0, 0.36, 1);
    transition: left .2s cubic-bezier(0.35, 0, 0.36, 1);
    left: 0
}

.popup--alert .cta.cta--icon-v2:before {
    display: none
}

.popup--alert .cta.cta--icon-v2:focus .cta--inner,
.cta.cta--icon-v2:hover .cta--inner {
    left: 24px
}

.popup--alert .cta.cta--icon-v2:focus .icon--prefix,
.cta.cta--icon-v2:hover .icon--prefix {
    opacity: 1
}

.popup--alert .cta.cta--icon-v2:focus .icon--suffix,
.cta.cta--icon-v2:hover .icon--suffix {
    opacity: 0
}

.popup--alert .cta.cta--icon-v2.cta.cta--icon-v2-leading {
    direction: rtl
}

.popup--alert .cta.cta--icon-v2.cta.cta--icon-v2-leading .cta--inner {
    -webkit-transition: left .2s cubic-bezier(0.35, 0, 0.36, 1);
    transition: left .2s cubic-bezier(0.35, 0, 0.36, 1)
}

.popup--alert .cta.cta--icon-v2.cta.cta--icon-v2-leading .icon--prefix {
    margin-left: auto;
    margin-right: -24px
}

.popup--alert .cta.cta--icon-v2.cta.cta--icon-v2-leading:focus .cta--inner,
.cta.cta--icon-v2.cta.cta--icon-v2-leading:hover .cta--inner {
    left: -24px
}

.popup--alert .cta--disabled {
    pointer-events: none
}

.popup--alert .cta--disabled.cta--underline:hover:after,
.cta--disabled.cta--underline:focus:after {
    -webkit-animation: none;
    animation: none
}`,KS=`
/* --- Language-specific font overrides --- */

/* Arabic font overrides */
[dir="rtl"] body,
[dir="rtl"] html,
[dir="rtl"] .top_cont h2,
[dir="rtl"] .top_cont p,
[dir="rtl"] .form_top_group,
[dir="rtl"] .form_top_group input,
[dir="rtl"] .form_top_group select,
[dir="rtl"] .form_check_title h3,
[dir="rtl"] .form_bottom_group button,
[dir="rtl"] .form_bottom_bar button,
[dir="rtl"] #hrTy,
[dir="rtl"] #hrTy h3,
[dir="rtl"] .popup__title,
[dir="rtl"] .popup__desc,
[dir="rtl"] .popup--alert .cta,
[dir="rtl"] .fullform-submit-intent-popup .popup__contents,
[dir="rtl"] .fullform-submit-intent-popup .cta {
  font-family: 'SamsungSS Head Light Arabic', 'SamsungSS Body Regular Arabic', 'SamsungSS Head Bold Arabic', 'SamsungSS Body Bold Arabic', arial, sans-serif !important;
}

/* Hebrew font overrides */
[dir="rtl"][lang="he"] body,
[dir="rtl"][lang="he"] html,
[dir="rtl"][lang="he"] .top_cont h2,
[dir="rtl"][lang="he"] .top_cont p,
[dir="rtl"][lang="he"] .form_top_group,
[dir="rtl"][lang="he"] .form_top_group input,
[dir="rtl"][lang="he"] .form_top_group select,
[dir="rtl"][lang="he"] .form_check_title h3,
[dir="rtl"][lang="he"] .form_bottom_group button,
[dir="rtl"][lang="he"] .form_bottom_bar button,
[dir="rtl"][lang="he"] #hrTy,
[dir="rtl"][lang="he"] #hrTy h3,
[dir="rtl"][lang="he"] .popup__title,
[dir="rtl"][lang="he"] .popup__desc,
[dir="rtl"][lang="he"] .popup--alert .cta,
[dir="rtl"][lang="he"] .fullform-submit-intent-popup .popup__contents,
[dir="rtl"][lang="he"] .fullform-submit-intent-popup .cta {
  font-family: 'SamsungSS Head Light Hebrew', 'SamsungSS Body Regular Hebrew', 'SamsungSS Head Bold Hebrew', 'SamsungSS Body Bold Hebrew', arial, sans-serif !important;
}
`,qS=`
/* --- RTL support (not present in the reference stylesheet) --- */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .form_check_title,
[dir="rtl"] .form_label {
  text-align: right;
}

[dir="rtl"] .form_bottom_check label {
  padding-left: 0;
  padding-right: 32px;
}

[dir="rtl"] .form_bottom_check label::after {
  left: auto;
  right: 0;
}

[dir="rtl"] .input_wrap .btn_clear {
  right: auto;
  left: 8px;
}

[dir="rtl"] .form_bottom_bar {
  direction: rtl;
}

/* --- Thank-you / error full-page states (the reference styled these two blocks with
   inline style="" attributes directly in its HTML; this generator keeps markup free of
   inline styles, so the equivalent rules live here instead) --- */
#hrTy,
#hrErr {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  margin: 0 auto;
  max-width: 480px;
  padding: 24px;
  text-align: center;
}

#hrTy h3,
#hrErr h3 {
  color: #000;
  font-family: "SamsungSS Head Bold", arial, sans-serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.5;
  margin: 0 0 10px;
}

#hrTy p,
#hrErr p {
  color: #000;
  font-size: 16px;
  line-height: 1.5;
  margin: 0 0 15px;
}

#hrTy a,
#hrErr a {
  color: #007bff;
}
`;function JS(e){return{path:e.css,contents:`${GS}
${KS}
${qS}`}}function YS(e){return e.replace(/[^a-zA-Z0-9_-]+/g,`-`).replace(/^-+|-+$/g,``)}function XS(e,t){let n=t.fileNamePrefix?.trim();if(n)return YS(n);let r=(e.locales.find(t=>t.code===e.meta.defaultLocale)?.langSubtag??`en`).toUpperCase(),i=e.meta.subsidiary.trim();return YS(i?`${i}-${r}`:r)}function ZS(e,t){let n=XS(e,t);return{prefix:n,css:`${n}.css`,dataJs:`${n}.js`,ffJs:`${n}_FF.js`,ocJs:`${n}_OC.js`,ffHtml:`${n}_FF.html`,ocHtml:`${n}_OC.html`}}function QS(e){let t=[];if(e.countryCode&&t.push(`<div class="form_text_bx select_bx" style="display: none;"><p class="form_label"></p><div class="select_wrap"><select autocomplete="off" data-pt-api="y" id="countryCode" name="countryCode"></select></div></div>`),e.email&&t.push(`<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p><div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" data-parsley-error-message="Enter a valid Email address" data-parsley-pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" data-parsley-required="true" data-parsley-type="email" data-pt-api="y" id="email" maxlength="128" name="email" placeholder="" spellcheck="false" type="email"><div class="btn_clear"></div></div></div>`),e.firstName||e.lastName){let n=[];e.firstName&&n.push(`<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p><div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" data-parsley-error-message="Letters are allowed" data-parsley-pattern="^[A-Za-z\\u0600-\\u06FF]+(\\s[A-Za-z\\u0600-\\u06FF]+)*$" data-parsley-required="true" data-pt-api="y" id="firstName" maxlength="200" name="firstName" placeholder="" spellcheck="false" type="firstName"><div class="btn_clear"></div></div></div>`),e.lastName&&n.push(`<div class="form_text_bx"><p class="form_label"><span></span><span class="star">*</span></p><div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" data-parsley-error-message="Letters are allowed" data-parsley-pattern="^[A-Za-z\\u0600-\\u06FF]+(\\s[A-Za-z\\u0600-\\u06FF]+)*$" data-parsley-required="true" data-pt-api="y" id="lastName" maxlength="200" name="lastName" placeholder="" spellcheck="false" type="lastName"><div class="btn_clear"></div></div></div>`),t.push(`<div class="form_text_group">${n.join(``)}</div>`)}return e.callingCode&&t.push(`<div class="form_text_bx select_bx"><p class="form_label"></p><div class="select_wrap"><select autocomplete="off" data-parsley-error-message="Select a value" data-parsley-required-if="#mobileNumber" data-parsley-validate-if-empty="true" data-pt-api="y" id="callingCode" name="callingCode"></select><div class="input_wrap"><input autocapitalize="none" autocomplete="off" autocorrect="off" data-parsley-trigger="blur" data-parsley-mobile-number-by-country="true" data-parsley-mobile-number-by-country-message="Enter a valid mobile number" data-parsley-type-message="Digits are allowed" data-parsley-type="digits" data-pt-api="y" id="mobileNumber" maxlength="10" name="mobileNumber" placeholder="" spellcheck="false" type="text"><div class="btn_clear"></div></div></div>`),t.join(``)}function $S(e){return`A${e}`}function eC(e,t){return`${e}${$S(t)}`}function tC(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var nC=RegExp(`\u2028`,`g`),rC=RegExp(`\u2029`,`g`);function iC(e){return JSON.stringify(e,null,2).replace(nC,`\\u2028`).replace(rC,`\\u2029`).replace(/<\/(script)/gi,`<\\/$1`)}function aC(e){let t=`<div class="form_check_title"><h3><span></span>${e.required?`<span class="star">*</span>`:``}</h3><p></p></div>`;if(e.controlType===`text`)return`<div class="form_check_module" id="${tC(e.id)}">`+t+`<div class="form_text_bx"><div class="input_wrap"><textarea id="${tC(e.id)}" name="${tC(e.id)}" rows="3" data-pt-api="y"></textarea></div></div></div>`;let n=e.controlType===`checkbox`?`checkbox`:`radio`,r=e.controlType===`radio`&&e.answers.length<=3?`radio_group`:`form_check_list_wrap`,i=e.controlType===`checkbox`?`form_check_list`:`radio_wrap`,a=e.order===1,o=e.answers.map((t,r)=>{let o=eC(e.id,t.order),s=$S(t.order),c=a&&r===0?` data-parsley-error-message="Must select atleast one"`:``,l=t.image?`<img src="${tC(t.image.src)}" alt="">`:``;return`<div class="${i}"><input type="${n}" id="${o}" name="${tC(e.id)}" value="${s}" data-pt-api="y"${c}><label for="${o}">${l}<p></p></label></div>`}).join(``);return`<div class="form_check_module" id="${tC(e.id)}">`+t+`<div class="${r}">${o}</div></div>`}var oC=`<script type="text/javascript" src="https://code.jquery.com/jquery-3.3.1.min.js"><\/script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/parsleyjs@2/dist/parsley.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/libphonenumber-js/1.11.4/libphonenumber-js.min.js"><\/script>`,sC=`<link rel="shortcut icon" href="https://res6.mena2p.crm.samsung.com/res/tracking/Favicon.png">`,cC=`<link rel="stylesheet" href="samsungSS_fonts_2026.css">`,lC=`<script src="https://assets.adobedtm.com/72afb75f5516/dd6b57adea42/launch-b679a712f5a6.min.js" async><\/script>`,uC=`https://res6.mena2p.crm.samsung.com/res/tracking/SGE_Hand_Raiser _romotionNRaffle_TnCsv3.pdf`,dC=e=>`<a${e?` class="${e}"`:``} style="text-align:center" href="${uC}" target="_blank">* Terms and conditions apply.<span></span><img class="form_bottom_img" src="blue_arr.png"></a>`;function fC(e,t,n,r){let i=n===`oc`,a=t.analytics?.enabled?lC:``,o=e.locales.find(t=>t.code===e.meta.defaultLocale),s=o?.langSubtag??`en`,c=o?.isRtl?`rtl`:`ltr`,l=QS(i?{callingCode:e.fields.callingCode,countryCode:e.fields.countryCode}:{email:e.fields.email,firstName:e.fields.firstName,lastName:e.fields.lastName,countryCode:e.fields.countryCode,callingCode:e.fields.callingCode}),u=e.questions.map(aC).join(``),d=!i&&e.fields.privacyPolicy?`<div class="form_bottom_check_group"><div class="form_bottom_check"><input id="privacyPolicy" name="privacyPolicy" type="checkbox" data-pt-api="y"><label for="privacyPolicy"><span></span><br><a href="#" target="_blank" id="privacyPolicyLink"><span></span></a><span class="star">*</span></label></div>`+(e.fields.marketingOptin?`<div class="form_bottom_check form_bottom_check2"><input id="subscribe" name="subscribe" type="checkbox" data-pt-api="y"><label for="subscribe"><span></span></label></div>`:``)+`</div>`:``,f=`<button class="disabled" disabled id="btnSubmit"></button><div class="error" id="apiError" style="display:none"></div>`+dC(i?`form_bottom_terms`:``),p=i?`<div class="form_bottom_bar" id="formBottomBar">${f}</div>`:`<div class="form_bottom_group">${d}${f}</div>`,m=i?`<h2><br class="b_850"><span></span></h2>`:``;return`<!doctype html>
<html lang="${s}" dir="${c}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Samsung</title>
${sC}
${cC}
<link rel="stylesheet" href="${r.css}">
${oC}
${a}
</head>
<body>
<div class="${i?`container_oc`:`container`}">
<div class="top_cont">${m}<p><span class="star">*</span><span id="requiredFieldNote"></span></p></div>
<div class="main">
<form action="" id="dataForm">
<div class="form_top_group">${l}</div>
<div class="form_check_group">${u}${p}</div>
</form>
</div>
</div>
<div id="hrTy" style="display:none"><h3></h3><p><a href="" target="_blank"></a></p></div>
<div id="hrErr" style="display:none"><h3></h3><p><a href="" target="_blank"></a></p></div>
<div id="overlay" style="display:none"><span class="loader"></span></div>
<section id="submitIntentPopup" class="popup popup--alert">
<div class="popup__dimmed"></div>
<div class="popup__contents-wrap"><div class="popup__contents"><div class="popup__inner-wrap"><div class="popup__inner">
<p class="popup__desc" id="submitIntentPopupMessage1"></p>
<p class="popup__desc" id="submitIntentPopupMessage2"></p>
</div></div>
<div class="popup__btn-wrap">
<button class="cta cta--outlined cta--black" id="submitIntentPopupNo"></button>
<button class="cta cta--contained cta--black" id="submitIntentPopupYes"></button>
</div>
</div></div>
</section>
<script src="${r.dataJs}"><\/script>
<script src="${i?r.ocJs:r.ffJs}"><\/script>
</body>
</html>
`}function pC(e,t,n){return{path:n.ffHtml,contents:fC(e,t,`ff`,n)}}function mC(e,t,n){return{path:n.ocHtml,contents:fC(e,t,`oc`,n)}}var hC={AB:`SIEL`,AC:`SCA`,AD:`SEIB`,AE:`SGE`,AF:`SEPAK`,AG:`SELA`,AI:`SELA`,AL:`SEAD`,AM:`SERC`,AN:`SEDA`,AO:`SSA`,AQ:`SSA`,AR:`SEASA`,AS:`SENZ`,AT:`SEAS`,AU:`SEAU`,AW:`SELA`,AX:`SENA`,AZ:`SERC`,BA:`SEAD`,BB:`SELA`,BD:`BANGLADESH`,BE:`SEBN`,BF:`SCA`,BG:`SEROM`,BH:`SGE`,BI:`SEEA`,BJ:`SCA`,BL:`SELA`,BM:`SELA`,BN:`SESP`,BO:`SECH`,BQ:`SELA`,BR:`SEDA`,BS:`SELA`,BT:`SIEL`,BV:`SEASA`,BW:`SSA`,BY:`SERC`,BZ:`SELA`,CA:`SECA`,CC:`SIEL`,CD:`SEEA`,CF:`SCA`,CG:`SCA`,CH:`SEAS`,CI:`SCA`,CK:`SENZ`,CL:`SECH`,CM:`SCA`,CO:`SAMCOL`,CR:`SELA`,CU:`SELA`,CV:`SCA`,CW:`SELA`,CX:`SIEL`,CY:`SEGR`,CZ:`SECZ`,DE:`SEG`,DG:`SIEL`,DJ:`SEEA`,DK:`SENA`,DM:`SELA`,DO:`SELA`,DZ:`SEMAG`,EC:`SELA`,EE:`SEB`,EG:`SEEG`,EH:`SESAR`,ER:`SEEA`,ES:`SEIB`,ET:`SEEA`,FD:`SEF`,FI:`SENA`,FJ:`SENZ`,FK:`SEUK`,FM:`SENZ`,FO:`SENA`,FR:`SEF`,GA:`SCA`,GB:`SEUK`,GD:`SELA`,GE:`SERC`,GF:`SEF`,GG:`SEUK`,GH:`SCA`,GI:`SEIB`,GL:`SENA`,GM:`SCA`,GN:`SCA`,GP:`SELA`,GQ:`SCA`,GR:`SEGR`,GS:`SEDA`,GT:`SELA`,GU:`SEAU`,GW:`SCA`,GY:`SELA`,HK:`SEHK`,HM:`SEAU`,HN:`SELA`,HR:`SEAD`,HT:`SELA`,HU:`SEH`,ID:`SEIN`,IE:`SEUK`,IL:`SEIL`,IM:`SEUK`,IN:`SIEL`,IO:`SIEL`,IQ:`SELV`,IR:`IRAN`,IS:`SENA`,IT:`SEI`,JE:`SEUK`,JM:`SELA`,JO:`SELV`,JP:`SEJ`,KE:`SEEA`,KG:`SECE`,KH:`TSE`,KI:`SENZ`,KM:`SSA`,KN:`SELA`,KW:`SGE`,KY:`SELA`,KZ:`SECE`,LA:`TSE`,LB:`SELV`,LC:`SELA`,LI:`SEAS`,LK:`SRI LANKA`,LR:`SCA`,LS:`SSA`,LT:`SEB`,LU:`SEBN`,LV:`SEB`,LY:`SEMAG`,MA:`SEMAG`,MC:`SEF`,MD:`SEUC`,ME:`SEAD`,MF:`SELA`,MG:`SSA`,MH:`SENZ`,MK:`SEAD`,ML:`SCA`,MM:`TSE`,MN:`SECE`,MO:`SEHK`,MP:`SEAU`,MQ:`SELA`,MR:`SCA`,MS:`SELA`,MT:`SEI`,MU:`SSA`,MV:`SRI LANKA`,MW:`SSA`,MX:`SEM`,MY:`SME`,MZ:`SSA`,NA:`SSA`,NC:`SENZ`,NE:`SCA`,NF:`SEAU`,NG:`SCA`,NI:`SELA`,NL:`SEBN`,NO:`SENA`,NP:`NEPAL`,NR:`SEAU`,NU:`SENZ`,NZ:`SENZ`,OM:`SGE`,PA:`SELA`,PE:`SEPR`,PF:`SENZ`,PG:`SENZ`,PH:`SEPCO`,PK:`SEPAK`,PL:`SEPOL`,PM:`SEF`,PN:`SEAU`,PR:`SELA`,PS:`SEIL`,PT:`SEIB`,PW:`SEPCO`,PY:`SELA`,QA:`SGE`,RE:`SSA`,RO:`SEROM`,RS:`SEAD`,RU:`SERC`,RW:`SEEA`,SA:`SESAR`,SB:`SENZ`,SC:`SEEA`,SD:`SEEA`,SE:`SENA`,SG:`SESP`,SH:`SEUK`,SI:`SEAD`,SJ:`SENA`,SK:`SECZ`,SL:`SCA`,SM:`SEI`,SN:`SCA`,SO:`SEEA`,SR:`SELA`,SS:`SEEA`,ST:`SCA`,SV:`SELA`,SX:`SELA`,SY:`SELV`,SZ:`SSA`,TC:`SELA`,TD:`SCA`,TF:`SEAU`,TG:`SCA`,TH:`TSE`,TJ:`SECE`,TK:`SEAU`,TL:`SEIN`,TM:`SECE`,TN:`SEMAG`,TO:`SENZ`,TR:`SETK`,TT:`SELA`,TV:`SENZ`,TW:`SET`,TZ:`SEEA`,UA:`SEUC`,UG:`SEEA`,UK:`SEUK`,UY:`SELA`,UZ:`SEUZ`,VA:`SEI`,VE:`SELA`,VG:`SELA`,VI:`SEDA`,VN:`SAVINA`,VU:`SENZ`,WF:`SEAU`,WS:`SENZ`,YE:`SGE`,YT:`SSA`,YU:`SEAD`,ZA:`SSA`,ZM:`SSA`,ZW:`SSA`},gC={IRAN:[{callingCode:`98`,countryCode:`IR`,countryName:{en_GB:`Iran`,fr_FR:`Iran`}}],SCA:[{callingCode:`247`,countryCode:`AC`,countryName:{en_GB:`Ascension Island`,fr_FR:`Île de l'Ascension`}},{callingCode:`229`,countryCode:`BJ`,countryName:{en_GB:`Benin`,fr_FR:`Bénin`}},{callingCode:`226`,countryCode:`BF`,countryName:{en_GB:`Burkina Faso`,fr_FR:`Burkina Faso`}},{callingCode:`237`,countryCode:`CM`,countryName:{en_GB:`Cameroon`,fr_FR:`Cameroun`}},{callingCode:`238`,countryCode:`CV`,countryName:{en_GB:`Cape Verde`,fr_FR:`Cap-Vert`}},{callingCode:`236`,countryCode:`CF`,countryName:{en_GB:`Central African Republic`,fr_FR:`République centrafricaine`}},{callingCode:`235`,countryCode:`TD`,countryName:{en_GB:`Chad`,fr_FR:`Tchad`}},{callingCode:`225`,countryCode:`CI`,countryName:{en_GB:`Côte d'Ivoire`,fr_FR:`Côte d'Ivoire`}},{callingCode:`240`,countryCode:`GQ`,countryName:{en_GB:`Equatorial Guin`,fr_FR:`Guinée équatoriale`}},{callingCode:`241`,countryCode:`GA`,countryName:{en_GB:`Gabon`,fr_FR:`Gabon`}},{callingCode:`220`,countryCode:`GM`,countryName:{en_GB:`Gambia`,fr_FR:`Gambie`}},{callingCode:`233`,countryCode:`GH`,countryName:{en_GB:`Ghana`,fr_FR:`Ghana`}},{callingCode:`224`,countryCode:`GN`,countryName:{en_GB:`Guinea`,fr_FR:`Guinée`}},{callingCode:`245`,countryCode:`GW`,countryName:{en_GB:`Guinea-Bissau`,fr_FR:`Guinée-Bissau`}},{callingCode:`231`,countryCode:`LR`,countryName:{en_GB:`Liberia`,fr_FR:`Libéria`}},{callingCode:`223`,countryCode:`ML`,countryName:{en_GB:`Mali`,fr_FR:`Mali`}},{callingCode:`222`,countryCode:`MR`,countryName:{en_GB:`Mauretania`,fr_FR:`Mauritanie`}},{callingCode:`227`,countryCode:`NE`,countryName:{en_GB:`Niger`,fr_FR:`Niger`}},{callingCode:`234`,countryCode:`NG`,countryName:{en_GB:`Nigeria`,fr_FR:`Nigéria`}},{callingCode:`242`,countryCode:`CG`,countryName:{en_GB:`Republic of Congo`,fr_FR:`République du Congo`}},{callingCode:`239`,countryCode:`ST`,countryName:{en_GB:`São Tomé and Príncipe`,fr_FR:`São Tomé-et-Principe`}},{callingCode:`221`,countryCode:`SN`,countryName:{en_GB:`Senegal`,fr_FR:`Sénégal`}},{callingCode:`232`,countryCode:`SL`,countryName:{en_GB:`Sierra Leone`,fr_FR:`Sierra Leone`}},{callingCode:`228`,countryCode:`TG`,countryName:{en_GB:`Togo`,fr_FR:`Togo`}}],SEEG:[{callingCode:`20`,countryCode:`EG`,countryName:{en_GB:`Egypt`,fr_FR:`Egypte`}}],SEIL:[{callingCode:`972`,countryCode:`IL`,countryName:{en_GB:`Israel`,fr_FR:`Israël`}},{callingCode:`970`,countryCode:`PS`,countryName:{en_GB:`Palestine`,fr_FR:`Palestine`}}],SELV:[{callingCode:`964`,countryCode:`IQ`,countryName:{en_GB:`Iraq`,fr_FR:`Irak`}},{callingCode:`962`,countryCode:`JO`,countryName:{en_GB:`Jordan`,fr_FR:`Jordanie`}},{callingCode:`961`,countryCode:`LB`,countryName:{en_GB:`Lebanon`,fr_FR:`Liban`}},{callingCode:`963`,countryCode:`SY`,countryName:{en_GB:`Syria`,fr_FR:`Syrie`}}],SEMAG:[{callingCode:`213`,countryCode:`DZ`,countryName:{en_GB:`Algeria`,fr_FR:`Algérie`}},{callingCode:`218`,countryCode:`LY`,countryName:{en_GB:`Libya`,fr_FR:`Libye`}},{callingCode:`212`,countryCode:`MA`,countryName:{en_GB:`Morocco`,fr_FR:`Maroc`}},{callingCode:`216`,countryCode:`TN`,countryName:{en_GB:`Tunisia`,fr_FR:`Tunisie`}}],SEPAK:[{callingCode:`93`,countryCode:`AF`,countryName:{en_GB:`Afghanistan`,fr_FR:`Afghanistan`}},{callingCode:`92`,countryCode:`PK`,countryName:{en_GB:`Pakistan`,fr_FR:`Pakistan`}}],SESAR:[{callingCode:`966`,countryCode:`SA`,countryName:{en_GB:`Saudi Arabia`,fr_FR:`Arabie saoudite`}},{callingCode:`212`,countryCode:`EH`,countryName:{en_GB:`Western Sahara`,fr_FR:`Sahara occidental`}}],SETK:[{callingCode:`90`,countryCode:`TR`,countryName:{en_GB:`Türkiye`,fr_FR:`Turquie`}}],SGE:[{callingCode:`971`,countryCode:`AE`,countryName:{ar_BH:`الإمَارَات`,en_BH:`United Arab Emirates`,ar_KW:`الإمَارَات`,en_KW:`United Arab Emirates`,ar_OM:`الإمَارَات`,en_OM:`United Arab Emirates`,ar_QA:`الإمَارَات`,en_QA:`United Arab Emirates`,ar_AE:`الإمَارَات`,en_AE:`United Arab Emirates`}},{callingCode:`973`,countryCode:`BH`,countryName:{ar_AE:`البحرين`,en_AE:`Bahrain`,ar_BH:`البحرين`,en_BH:`Bahrain`,ar_KW:`البحرين`,en_KW:`Bahrain`,ar_OM:`البحرين`,en_OM:`Bahrain`,ar_QA:`البحرين`,en_QA:`Bahrain`}},{callingCode:`965`,countryCode:`KW`,countryName:{ar_BH:`الكويت`,en_BH:`Kuwait`,ar_KW:`الكويت`,en_KW:`Kuwait`,ar_OM:`الكويت`,en_OM:`Kuwait`,ar_QA:`الكويت`,en_QA:`Kuwait`,ar_AE:`الكويت`,en_AE:`Kuwait`}},{callingCode:`968`,countryCode:`OM`,countryName:{ar_BH:`عُمان`,en_BH:`Oman`,ar_KW:`عُمان`,en_KW:`Oman`,ar_OM:`عُمان`,en_OM:`Oman`,ar_QA:`عُمان`,en_QA:`Oman`,ar_AE:`عُمان`,en_AE:`Oman`}},{callingCode:`974`,countryCode:`QA`,countryName:{ar_BH:`قطر`,en_BH:`Qatar`,ar_KW:`قطر`,en_KW:`Qatar`,ar_OM:`قطر`,en_OM:`Qatar`,ar_QA:`قطر`,en_QA:`Qatar`,ar_AE:`قطر`,en_AE:`Qatar`}}],SIEL:[{callingCode:``,countryCode:`AB`,countryName:{en_GB:`Abkhazia`,fr_FR:`Abkhazie`}},{callingCode:`975`,countryCode:`BT`,countryName:{en_GB:`Bhutan`,fr_FR:`Bhoutan`}},{callingCode:`246`,countryCode:`IO`,countryName:{en_GB:`British Indian Ocean Territory`,fr_FR:`Territoire britannique de l'océan Indien`}},{callingCode:`61`,countryCode:`CX`,countryName:{en_GB:`Christmas Island`,fr_FR:`Île Christmas`}},{callingCode:`61`,countryCode:`CC`,countryName:{en_GB:`Cocos Islands`,fr_FR:`Îles Cocos`}},{callingCode:`246`,countryCode:`DG`,countryName:{en_GB:`Diego Garcia`,fr_FR:`Diego García`}},{callingCode:`91`,countryCode:`IN`,countryName:{en_GB:`India`,fr_FR:`Inde`}}]},_C=Object.fromEntries([...new Set(Object.values(hC))].filter(e=>!(e in gC)).map(e=>[e,[]])),vC={...gC,..._C};Object.keys(vC).sort();var yC={emailError:`Please enter a valid Email address`,firstNameError:`Only letters are allowed`,lastNameError:`Only letters are allowed`,callingCodeError:`Please select a value`,mobileNumberType:`Only digits are allowed`,mobileNumberLength:`Must be 9 or 10 digits`,mobileNumberError:`Enter a valid mobile number`,zipCodeError:`Please enter a valid ZIP code of 5 to 9 characters`,reCaptchaRequired:`Please complete reCaptcha verification`,apiError:`Something went wrong. Please try again later.`,modalMessage_1:`Are you sure you want to submit?`,modalMessage_2:`You won't be able to change your answers after this.`,modalButtonYes:`Yes, submit`,modalButtonNo:`No, go back`};function bC(e,t,n){let r=e[t]??e[n]??{},i=e[n]??{};return{heading:r.heading??i.heading??``,subHeading:r.subHeading??i.subHeading??``,subHeadingUrlText:r.subHeadingUrlText??i.subHeadingUrlText??``,subHeadingUrl:r.subHeadingUrl??i.subHeadingUrl??``}}function xC(e,t,n){let r=e.meta.defaultLocale,i=e.locales.map(e=>e.code),a={},o={},s={},c={},l={};for(let t of i){let n=e.fields;a[t]={headingBeforeBreakFF:``,headingAfterBreakFF:``,headingBeforeBreak:n.headingBeforeBreakByLocale?MS(n.headingBeforeBreakByLocale,t,r):``,headingAfterBreak:n.headingAfterBreakByLocale?MS(n.headingAfterBreakByLocale,t,r):``,requiredField:n.requiredFieldNoteByLocale?MS(n.requiredFieldNoteByLocale,t,r):``,label:{countryCode:n.countryCode?MS(n.countryCode.labelByLocale,t,r):``,email:n.email?MS(n.email.labelByLocale,t,r):``,firstName:n.firstName?MS(n.firstName.labelByLocale,t,r):``,lastName:n.lastName?MS(n.lastName.labelByLocale,t,r):``,callingCode:n.callingCode?MS(n.callingCode.labelByLocale,t,r):``,zipCode:``},placeholder:{email:n.email?MS(n.email.placeholderByLocale,t,r):``,firstName:n.firstName?MS(n.firstName.placeholderByLocale,t,r):``,lastName:n.lastName?MS(n.lastName.placeholderByLocale,t,r):``,mobileNumber:``,zipCode:``},callingCodeDropdownFirstEntry:n.callingCode?MS(n.callingCode.dropdownFirstEntryByLocale,t,r):``,privacyPolicy:n.privacyPolicy?MS(n.privacyPolicy.textByLocale,t,r):``,privacyPolicyLink:{label:``,image:``,imageAlt:``,url:n.privacyPolicy?MS(n.privacyPolicy.linkUrlByLocale,t,r):``},subscribe:n.marketingOptin?MS(n.marketingOptin.labelByLocale,t,r):``,submitButton:MS(n.submitButton.labelByLocale,t,r),hrTy:bC(e.thankYou,t,r),redirectAfterSuccessUrl:n.redirectAfterSuccessUrlByLocale?MS(n.redirectAfterSuccessUrlByLocale,t,r):``},o[t]={hrErr:bC(e.pageError,t,r)};let i={},u={};for(let n of e.questions){i[n.id]={heading:MS(n.headingByLocale,t,r),subheading:MS(n.subheadingByLocale,t,r)};let e={};for(let i of n.answers){let n=MS(i.textByLocale,t,r);e[$S(i.order)]=i.image?{label:n,image:i.image.src,imageAlt:i.image.alt??n}:n}u[n.id]=e}s[t]=i,c[t]=u;let d=e.validationMessages[t]??{};l[t]={...yC,...d}}let u=[[`page_error`,o],[`fields`,a],[`questions`,s],[`answers`,c],[`validation_messages`,l],[`country_subsidiary`,hC],[`subsidiary_detail`,vC],[`param`,{apiEndpoint:t.apiEndpoint??``,channel:{fullForm:t.channel?.fullForm??``,oneClick:t.channel?.oneClick??``},channelDetail:{fullForm:t.channelDetail?.fullForm??``,oneClick:t.channelDetail?.oneClick??``},fallbackLanguage:r,project:t.project??``,reCaptchaSiteKey:``,redirectAfterSuccessInSecond:`5`,source:{fullForm:t.source?.fullForm??``,oneClick:t.source?.oneClick??``},voucherRequired:t.voucherRequired??`N`,analytics:t.analytics??{enabled:!1}}]].map(([e,t])=>`const ${e} = ${iC(t)};`).join(`

`)+`
`;return{path:n.dataJs,contents:u}}var SC=`/*
Function to hide reCaptcha verification error
function hideCaptchaVerificationError()
{
    $("#reCaptchaRequired").hide();
}

reCapthca Callback method
/*var onloadCallback = function()
{
    grecaptcha.render("g-recaptcha",
    {
        "sitekey" : param["reCaptchaSiteKey"],
        "callback": hideCaptchaVerificationError
    });
}
*/

// Once the document is ready
$(document).ready(function ()
{
    // Function to set content for Error Message
    // It is kept separate instead of being defined within setFieldData to provide handling in case data is not available in config for received language
    // If data is not available in config for received language, fallbackLanguage will be used
    function setErrorContent()
    {
        var heading = "",
            subHeading = "",
            subHeadingUrl = "",
            subHeadingUrlText = "";

        try
        {
            heading = page_error[language]["hrErr"]["heading"];

            subHeading = page_error[language]["hrErr"]["subHeading"];

            subHeadingUrl = page_error[language]["hrErr"]["subHeadingUrl"];

            subHeadingUrlText = page_error[language]["hrErr"]["subHeadingUrlText"];
        }
        catch(err)
        {
            heading = page_error[param["fallbackLanguage"]]["hrErr"]["heading"];

            subHeading = page_error[param["fallbackLanguage"]]["hrErr"]["subHeading"];

            subHeadingUrl = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrl"];

            subHeadingUrlText = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrlText"];
        }
        finally
        {
            $("div#hrErr").find("h3").html(heading);

            $("div#hrErr").find("a").attr("href", subHeadingUrl);

            $("div#hrErr").find("a").html(subHeadingUrlText);

            $("div#hrErr").find("p").html(subHeading + $("div#hrErr").find("p").html());
        }
    }
	
    // Function to get value for passed key from fields JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder
    function setFieldData()
    {
        // HTML Language
        $("html").attr("lang", language.substring(0, language.indexOf("_")));

        // HTML Direction (RTL/LTR)
        var rtlLangs = ["ar", "he", "ku", "fa", "ur", "yi"];
        var langSubtag = language.substring(0, language.indexOf("_"));
        $("html").attr("dir", rtlLangs.indexOf(langSubtag) !== -1 ? "rtl" : "ltr");

        // Error page / section
        setErrorContent();

        // Heading
        //$("div.top_cont h2").html(fields[language]["headingBeforeBreakFF"] + $("div.top_cont h2").html() + fields[language]["headingAfterBreakFF"]);

        // Subheading
        $("div.top_cont p").html($("div.top_cont p").html() + fields[language]["requiredField"]);

        // Profile Field(s)
        $("div.form_top_group").find("div.form_text_bx").each(function()
        {
            // Field Label
            var pFormLabel = $(this).find("p.form_label");
            
            pFormLabel.html(fields[language]["label"][pFormLabel.parent().find("input, select").attr("id")] + pFormLabel.html());

            // Field Placeholder
            $(this).find("input, select").each(function()
            {
                if($(this).attr("placeholder") != undefined)
                {
                    $(this).attr("placeholder", fields[language]["placeholder"][$(this).attr("id")])
                }
            });
        });

        // Privacy Policy & Subscribe
        $("div.form_bottom_group > div.form_bottom_check_group").find("div.form_bottom_check").each(function()
        {
            // Label
            var ckbLabel = $(this).find("label");

            ckbLabel.html(fields[language][ckbLabel.attr("for")] + ckbLabel.html());

            // Link within Label
            var ckbLabelLink = ckbLabel.find("a");

            // Is present
            if(ckbLabelLink.length === 1)
            {
                ckbLabelLink.children("img").attr("alt", fields[language][ckbLabel.attr("for") + "Link"]["imageAlt"]);

                ckbLabelLink.children("img").attr("src", fields[language][ckbLabel.attr("for") + "Link"]["image"]);

                ckbLabelLink.html(fields[language][ckbLabel.attr("for") + "Link"]["label"] + ckbLabelLink.html());

                ckbLabelLink.attr("href", fields[language][ckbLabel.attr("for") + "Link"]["url"]);
            }
        });

        // Submit Button
        $("#btnSubmit").html(fields[language]["submitButton"]);
        
        // Thank You page / section
        $("div#hrTy").find("h3").html(fields[language]["hrTy"]["heading"]);

        $("div#hrTy").find("a").attr("href", fields[language]["hrTy"]["subHeadingUrl"]);

        $("div#hrTy").find("a").html(fields[language]["hrTy"]["subHeadingUrlText"]);

        $("div#hrTy").find("p").html(fields[language]["hrTy"]["subHeading"] + $("div#hrTy").find("p").html());
    }

    // Function to get value for passed key from questions & answers JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder
    function setQuestionAndAnswerData()
    {
        $("div.form_check_group > div.form_check_module").each(function()
        {
            var questionId = $(this).attr("id");

            // Question
            $(this).find("div.form_check_title h3").html(questions[language][questionId]["heading"] + $(this).find("div.form_check_title h3").html());

            $(this).find("div.form_check_title p").html(questions[language][questionId]["subheading"]);

            // Answer
            $(this).find("input[name='" + questionId + "']").each(function()
            {
                var input = $(this);

                var label = input.next();

                if (label.children().length == 0)
                {
                    // Answer with Text inside <label>
                    label.html(answers[language][questionId][input.val()]);
                }
                else if (label.children().length == 1)
                {
                    // Answer with Text inside <p> (within <label>)
                    label.children("p").html(answers[language][questionId][input.val()]);
                }
                else if (label.children().length == 2)
                {
                    // Answer with Text & Image (within <label>)
                    label.children("p").html(answers[language][questionId][input.val()]["label"]);

                    label.children("img").attr("src", answers[language][questionId][input.val()]["image"]);

                    label.children("img").attr("alt", answers[language][questionId][input.val()]["imageAlt"]);
                }
            });
        });
    }

    // Function to get value for passed key from validation_messages JSON constant variable (present in Translation JS) based on Language AND set it as respective (Parsley) Validation Message
    function setValidationMessage()
    {
        $("input[data-parsley-error-message], select[data-parsley-error-message]").each(function()
        {
            $(this).attr("data-parsley-error-message", validation_messages[language][$(this).attr("id") + "Error"]);
        });

        $("input[data-parsley-type-message]").each(function()
        {
            $(this).attr("data-parsley-type-message", validation_messages[language][$(this).attr("id") + "Type"]);
        });

        $("input[data-parsley-length-message]").each(function()
        {
            $(this).attr("data-parsley-length-message", validation_messages[language][$(this).attr("id") + "Length"]);
        });

        $("input[data-parsley-mobile-number-by-country-message]").each(function()
        {
            $(this).attr("data-parsley-mobile-number-by-country-message", validation_messages[language][$(this).attr("id") + "Error"]);
        });


        //$("#reCaptchaRequired").html(validation_messages[language]["reCaptchaRequired"]);

         $("#apiError").html(validation_messages[language]["apiError"]);

        // Modal Messages
        $("#submitIntentPopupMessage1").text(validation_messages[language]["modalMessage_1"]);
        $("#submitIntentPopupMessage2").text(validation_messages[language]["modalMessage_2"]);
        $("#submitIntentPopupYes").text(validation_messages[language]["modalButtonYes"]);
        $("#submitIntentPopupNo").text(validation_messages[language]["modalButtonNo"]);
    }

    // Function to populate Country Code dropdown
    function populateCountryCodeDropdown()
    {
        // Get Subsidiary from Country Code (parsed from Language)
        var subsidiary = country_subsidiary[countryCode];

        // Get Country Code dropdown
        var ddCountryCode = $("#countryCode");

        // Check if Country Code dropdown is available
        var isCountryCodeDrodownPresent = (ddCountryCode.length === 1);

        // If Country Code dropdown is available
        if (isCountryCodeDrodownPresent)
        {
            // Set Option(s) in Country Code dropdown
            $.each(subsidiary_detail[subsidiary], function (val, text)
            {
                // Append value(s) to Country Code dropdown
                ddCountryCode.append($("<option></option>").val(text.countryCode).html(text.countryName[language]));
            });
        
            // Show Country (parsed from Language) as selected
            ddCountryCode.val(countryCode);

            // If Subsidiary has more than 1 Country, then only show the dropdown
            if(subsidiary_detail[subsidiary].length > 1)
            {
                ddCountryCode.closest("div.form_text_bx").css("display", "block");
            }
        }
    }

    // Function to populate Calling Code dropdown
    function populateCallingCodeDropdown()
    {
        // Get Subsidiary from Country Code (parsed from Language)
        var subsidiary = country_subsidiary[countryCode];

        // Calling Code dropdown
        var ddCallingCode = $("#callingCode");

        // Set Default Value in Calling Code dropdown
        //ddCallingCode.append($("<option></option>").val("0").html(fields[language]["callingCodeDropdownFirstEntry"]));

        // Disable First / Default Entry in Calling Code dropdown
        $("#callingCode option:first-child").attr("disabled", "disabled").prop("selected", true);

        // Set Option(s) in Calling Code dropdown
        $.each(subsidiary_detail[subsidiary], function (val, text)
        {
            // If Calling Code is not blank
            if (text.callingCode != "")
            {
                ddCallingCode.append($("<option></option>").val(text.callingCode).html(text.countryName[language] + " (+" + text.callingCode + ")"));
            }
        });
    }

    // Function to reset selected value in Calling Code dropdown if Mobile Number is removed
    function resetCallingCode()
    {
        if($("#mobileNumber").val() == "")
        {
            // Reset value
            $("#callingCode").val("0");

            // Remove Parsley validation message
            $("#callingCode").parsley().reset();
        }
    }

    // Function to enable Submit button if both Privacy Policy & Subscribe checkboxes are checked (else keep Submit button disabled)
    function enableDisableSubmit()
    {
        if ($("#privacyPolicy").is(":checked") && ($("#Q1A1").is(":checked") || $("#Q1A2").is(":checked") ||$("#Q1A3").is(":checked")))
        {
            $("#btnSubmit").prop("disabled", false);

            $("#btnSubmit").removeClass("disabled");
        }
        else
        {
            $("#btnSubmit").prop("disabled", true);

            $("#btnSubmit").addClass("disabled");
        }
    }

    function validateModal()
    {
        // Check whether any questions in the full form have been answered
        submitModalAnsweredAny = $('[data-pt-api="y"][name^=Q]').filter((i, el) => el.checked).length > 0

		//submitModalWithsub = $("#subscribe").is(":checked");
        return !submitModalHasOpened && !submitModalAnsweredAny;
    }

    function closeSubmitModal()
    {
        if (submitModalElement)
        {
            submitModalElement.removeClass("popup--open");
        }
    }

    function showSubmitModal(resumeCallback)
    {
		
        submitModalResume = typeof resumeCallback === "function" ? resumeCallback : null;

        if (!submitModalElement) // Bind events once
        {
            submitModalElement = $("#submitIntentPopup");
            submitModalElement.find("#submitIntentPopupYes, .popup__close, .popup__dimmed").on("click", closeSubmitModal);
            submitModalElement.find("#submitIntentPopupNo").on("click", function ()
            {
                closeSubmitModal();
                
                if (submitModalResume)
                {
                    submitModalResume();
                    submitModalResume = null;
                }
            });
        }

        submitModalElement.addClass("popup--open");
        submitModalHasOpened = true;
		
    }

    // Function to attach different event(s) to various element(s)
    function attachEvent()
    {
        // Add Parsley Custom Validator to validate Calling Code (value should be selected in dropdown if Mobile Number is entered)
        window.Parsley.addValidator("requiredIf", {
            validateString : function(value, requirement)
            {
                if($(requirement).parsley().isValid())
                {
                    if (jQuery(requirement).val())
                    {
                        return !!value;
                    }
                }

                return true;
            }
        });

        // Build callingCode -> countryCode mapping from subsidiary_detail
        var callingCodeToCountry = {};
        $.each(subsidiary_detail, function(subsidiary, countries) {
            $.each(countries, function(i, country) {
                if (country.callingCode && country.callingCode !== "") {
                    callingCodeToCountry[country.callingCode] = country.countryCode;
                }
            });
        });

        // Custom Parsley Validator - validate mobile number against selected calling code using libphonenumber-js
        window.Parsley.addValidator("mobileNumberByCountry", {
            validateString: function (value) {
                if (value.trim() === "") return true; // empty value handled by required-if on callingCode

                var callingCode = $("#callingCode").val();
                if (!callingCode || callingCode === "0") return false;

                // Check digit length by country: UAE allows 9 digits, others allow 8
                var trimmedValue = value.replace(/\\s/g, "");
                if (callingCode === "971") {
                    if (trimmedValue.length !== 9) return false;
                } else {
                    if (trimmedValue.length !== 8) return false;
                }

                var fullNumber = "+" + callingCode + value;
                try {
                    var phoneNumber = libphonenumber.parsePhoneNumberFromString(fullNumber);
                    return phoneNumber && phoneNumber.isValid();
                } catch (e) {
                    return false;
                }
            },
            message: "Enter a valid mobile number"
        });

        // Clear / reset user entered data (from Profile fields)
        $(".btn_clear").on("click", function()
        {
            // Parent of element having btn_clear class
            var parent = $(this).parent();

            // Find input field present in parent container (having element with btn_clear class)
            var inputField = parent.find("input");

            // If input field is present
            if (inputField.length === 1)
            {
                // Reset input field value
                inputField.val("");

                // Remove Parsley validation message
                inputField.parsley().reset();

                // Find second parent (parent element's parent) of element having btn_clear class
                var secondParent = parent.parent();

                // Find dropdown field present in secodn parent container
                var ddSelect = secondParent.find("select");

                // If dropdown is present && is dependent on input field
                if((ddSelect.length === 1) && (ddSelect.attr("data-parsley-required-if") != undefined) && (ddSelect.attr("data-parsley-required-if") == ("#" + inputField.attr("id"))))
                {
                    // Reset dropdown value
                    ddSelect.val(secondParent.find("select option:first-child").val());

                    // Remove Parsley validation message
                    ddSelect.parsley().reset();
                }
            }
        });

        // Attach event to reset Calling Code if Mobile Number is removed
        $("#mobileNumber").on("change", resetCallingCode);

        // Attach event to check Submit button state (enabled / disabled) on check / uncheck of Privacy Policy & Subscribe checkboxes
        $("#privacyPolicy, #Q1A1, #Q1A2, #Q1A3").on("change", enableDisableSubmit);
		//$("div.form_bottom_check_group input[type='checkbox'], #Q1A1, #Q1A2, #Q1A3").on("change", enableDisableSubmit);

        // For Calling Code & Mobile Number fields, override Parsley method to change DOM position of validation message
        window.Parsley.on('field:error', function()
        {
            if(this.$element.attr("id") == "callingCode")
            {
                $("#callingCode").parent().prev().after($("#callingCode").next("span.parsley-errors"));
            }

            if(this.$element.attr("id") == "mobileNumber")
            {
                $("#mobileNumber").before($("#mobileNumber").next("span.parsley-errors"));
				// Force red color on mobile number validation errors
                $("#mobileNumber").next("span.parsley-errors").find("span.parsley-error").css("color", "red");
            }
        });
    }

    
    /*
    Function to check if User has verified the reCaptcha
    function isCaptchaVerified()
    {
        return ((grecaptcha) && (grecaptcha.getResponse().length !== 0));
    }
    */
   

    // Function to carry out task(s) at the start of Form submit process
    function preSubmitProcess()
    {
        // Disable Submit button
        $("#submitform").attr("disabled", true).addClass("disabled");

        showOverlay();

        // Hide error message
        $("#apiError").hide();
    }

    // Function to show Overlay (with Loader)
    function showOverlay()
    {
        if( $("#overlay").css("display") == "none")
        {
            $("#overlay").css("display", "block");
        }
    }

    // Function to hide Overlay (with Loader)
    function hideOverlay()
    {
        if( $("#overlay").css("display") == "block")
        {
            $("#overlay").css("display", "none");
        }
    }

    // Function to show div confirming that data was successfully sent to server
    function showSuccess()
    {
        // Hide div having Form fields
        $("div.container").css("display", "none");

        // Empty div (having Form fields)
        $("div.container").empty();

        // Hide div having Error message
        $("#hrErr").css("display", "none");

        // Empty div (having Error message)
        $("#hrErr").empty();

        // Scroll to Top
        window.scrollTo({
        top: 0,
        behavior: "smooth"
        });

        // Show div having Success message
        $("#hrTy").css("display", "block");

        // Set Timeout for Redirection
        window.top.location.href = fields[language]["redirectAfterSuccessUrl"];
        //setTimeout(function (){ window.top.location.href = fields[language]["redirectAfterSuccessUrl"]; }, (parseInt(param["redirectAfterSuccessInSecond"], 8) * 1000));
		window.parent.postMessage('success_message', '*');  
        hideOverlay();
		const heightn = document.body.scrollHeight;
		parent.postMessage(heightn, '*'); 

        // Empty div (having Ovelary with Loader)
        $("#overlay").empty();

        // Adobe Analytics Tracking - Submit Form Event
        if (param?.analytics?.enabled) {
            _satellite.track("submit_form");
        }
    }

    // Function to show div informing about error
    function showError()
    {
        // Hide div having Form fields
        $("div.container").css("display", "none");

        // Empty div (having Form fields)
        $("div.container").empty();

        // Hide div having Success message
        $("#hrTy").css("display", "none");

        // Empty div (having Success message)
        $("#hrTy").empty();

        // Scroll to Top
        window.scrollTo({
        top: 0,
        behavior: "smooth"
        });

        // Show div having Error message
        $("#hrErr").css("display", "block");

        hideOverlay();

        // Empty div (having Ovelary with Loader)
        $("#overlay").empty();
    }

    // Function to parse User Agent to get Platform Type
    function getPlatformType()
    {
        var userAgent = navigator.userAgent.toString();

        var platformType = "web";

        if(!!(window.EcommAndroidClient || window.flutter_inappwebview) || userAgent.indexOf('samsung-mobile-app') > -1)
        {
            platformType = "app";
        }

        return platformType;
    }

    // Function to Identify HHP using Calling Code & Mobile Number
    function identifyHHP(callingCode, mobileNumber)
    {
        var hhp =  "";

        if (callingCode != null && callingCode != "" && mobileNumber != "")
        {
            hhp = (callingCode + mobileNumber);
        }

        return hhp;
    }

    // Function to handle error occurred during API call
    function apiCallErrorHandler()
    {
        // Show error message
        $("#apiError").show();

        // Enable Submit button so that user can try again
        enableDisableSubmit();

        // Scroll to Bottom
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
        });

        hideOverlay();
    }

    // Function to Send Data to API
    function sendData(request)
    {
        try
        {
            fetch(param["apiEndpoint"], {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(request)
            })
            .then(response =>
            {
                if(!(response.ok) || response.status != "200")
                {
                    apiCallErrorHandler();
                }
                else
                {
                    // Submit Success Tagging
                    window.parent.postMessage({ type: 'submit_success', content: 'the next galaxy f2h26-pre registration_register' }, '*')
					
                    showSuccess();
                }
            }).
            catch(error =>
            {
                apiCallErrorHandler();
            });
        }
        catch(err)
        {
            apiCallErrorHandler();
        }
    }

    function uuidv4Fallback() {
        // Return a RFC4122 version 4 compliant UUID
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
	
    // iOS or MacOS íŒë³„ í•¨ìˆ˜
    function isIOS() {
        var ua = navigator.userAgent || navigator.vendor || window.opera;
        var iOSClassic = /iPhone|iPad|iPod/.test(ua);
        var iPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        var MacOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints <= 1);
        var hasMacUA = /Macintosh/.test(ua) && !iPadOS;
        return iOSClassic || iPadOS || MacOS || hasMacUA;
    }
    // Function to create Request data based on User Input & call method to trigger API
    function mapParam(userResponse, isSubmitClicked)
    {
        var dtmCurrent = new Date();

        var requestBody = {
            app_yn: (getPlatformType() === "app" ? "Y" : "N"),
			channel: ch === "" ? param["channel"]["fullForm"] : ch,
			channel_detail: chd === "" ? param["channelDetail"]["fullForm"] : chd,
            cid: userResponse["campaignId"],
            country_alpha_2: userResponse["countryCode"],
            deliveryId: userResponse["deliveryId"],
            email: userResponse["email"],
            first_name: userResponse["firstName"],
            hhp: identifyHHP(userResponse["callingCode"], userResponse["mobileNumber"]),
            imei: "",
            language: userResponse["language"],
            last_name: userResponse["lastName"],
            mid: "",
            pin_code: userResponse["zipCode"],
            privacy_policy_yn: (userResponse["privacyPolicy"] === "on" ? "Y" : "N"),
            project: param["project"],
            q01Answer: userResponse["Q1"],
            q02Answer: userResponse["Q2"],
            q03Answer: userResponse["Q3"],
            q04Answer: userResponse["Q4"],
            q05Answer: userResponse["Q5"],
            q06Answer: "",
            q07Answer: "",
            q08Answer: "",
            q09Answer: "",
            q10Answer: "",
            q11Answer: "",
            q12Answer: "",
            q13Answer: "",
            q14Answer: "",
            q15Answer: "",
            q16Answer: "",
            q17Answer: "",
            q18Answer: "",
            q19Answer: "",
            q20Answer: "",
            recipientId: userResponse["recipientId"],
            registerDatetime: dtmCurrent.toISOString(),
            source: param["source"]["fullForm"],
            subscribe_yn: (userResponse["subscribe"] === "on" ? "Y" : "N"),
            tm_yn: "",
            uniqueid: dtmCurrent.getTime() + "_" + (crypto.randomUUID ? crypto.randomUUID() : uuidv4Fallback()) + "_" + Math.floor(Math.random() * 1e12).toString().padStart(12, "0"),
            VoucherRequired: param["voucherRequired"],
			oneclickFlag: "N",
            submitFlag: (isSubmitClicked === true ? "Y" : "N"),
            iosFlag: (isIOS() ? "Y" : "N")
        };

        return requestBody;
    }

    try
    {
        // Get Parameter Value from URL
        var frameUrlParam = new URLSearchParams(window.location.search);

        var language = frameUrlParam.get("lang") || param["fallbackLanguage"];

        var campaignId = frameUrlParam.get("cid") || "";

        var deliveryId = frameUrlParam.get("did") || "";

        var recipientId = frameUrlParam.get("id") || "";

        var countryCode = language.substring(language.indexOf("_") + 1);
		
		var ch = frameUrlParam.get("ch") || "";
			
		var chd = frameUrlParam.get("chd") || "";

        setFieldData();

        setQuestionAndAnswerData();

        setValidationMessage();

        populateCountryCodeDropdown();

        populateCallingCodeDropdown();

        attachEvent();

        // Load and display submit modal (modal.html) when form is submitted, or none of answers are selected
        var submitModalElement = null;
        var submitModalResume = null;
        var submitModalHasOpened = false;
        var submitModalAnsweredAny = false;

        var parsleyConfig = {
            errorsWrapper: '<span class="parsley-errors"></span>',
            errorTemplate: '<span class="parsley-error"></span>',
            excluded: 'input[type=button], input[type=submit], input[type=reset], input[type=hidden], input[class=noValidate]',
        }

        function processValidatedSubmit()
        {
            preSubmitProcess();

            var formElements = document.getElementById("dataForm");

            var elementId,
                elementName,
                objectValue,
                cBrBData = {},
                formData = [],
                elementDataAttr,
                userResponse = {},
                isSubmitClicked = true;

            // Process all the Form Fields
            for (i = 0; i < formElements.length; i++)
            {
                if (formElements.elements[i].type != "hidden")
                {
                    elementId = formElements.elements[i].id;

                    elementName = formElements.elements[i].name;

                    elementDataAttr = formElements.elements[i].getAttribute("data-pt-api");

                    if (elementDataAttr && elementDataAttr.trim() !== "" && elementDataAttr.trim() === "y")
                    {
                        if (formElements.elements[i].type == "radio")
                        {
                            if (!cBrBData[elementName])
                            {
                                cBrBData[elementName] = [];
                            }

                            if ($("#" + elementId).is(":checked"))
                            {
                                cBrBData[elementName].push($("#" + elementId).val());
                            }
                        }
                        else if (formElements.elements[i].type == "checkbox")
                        {
                            if (!cBrBData[elementName])
                            {
                                cBrBData[elementName] = [];
                            }

                            if ($("#" + elementId).is(":checked"))
                            {
                                cBrBData[elementName].push($("#" + elementId).val());
                            }
                        }
                        else
                        {
                            objectValue = $("#" + elementId).val();

                            formData.push({name: elementName, value: objectValue});
                        }
                    }
                }
            }

            Object.keys(cBrBData).forEach(function (key)
            {
                formData.push({ name: key, value: cBrBData[key].join("|") });
            });

            // Move data from Array to Key / Value pair
            for (var i=0, len=formData.length; i < len; i++)
            {
                userResponse[formData[i]["name"]] = formData[i]["value"];
            }

            // If Country Code dropdown is present in form, then pick the value from dropdown -- This is already handled above along with other fields (no special handling required).
            // If Country Code dropdown is not present in form, then pick the value from URL (parsed from Language).
            if(userResponse["countryCode"] == null || userResponse["countryCode"] == undefined)
            {
                userResponse["countryCode"] = countryCode;
            }

            // Add data determined earlier (from URL Parameter) to Key / Value pair
            userResponse["campaignId"] = campaignId;

            userResponse["deliveryId"] = deliveryId;

            userResponse["recipientId"] = recipientId;

            userResponse["language"] = language;
			
			//userResponse["subscribe"] = $("#subscribe").val();

            userResponse["channel"] = ch;

            userResponse["channel_detail"] = chd;

            // Call function to map (API) Parameter with User Response & send data to server
            sendData(mapParam(userResponse, isSubmitClicked));
        }

        // Carry out following after the submit button is clicked
        $("form").parsley(parsleyConfig).on("form:submit", function ()
        {
            validateModal() ? showSubmitModal(processValidatedSubmit) : processValidatedSubmit();

			/*
			Check if reCaptcha is verified
			if (($(".g-recaptcha").length) && (!(isCaptchaVerified())))
			{
				$("#reCaptchaRequired").show();

				return false;
			}
			*/

            return false;
        });
    }
    catch(err)
    {
        showError();
    }
});

function postHeight(e) {
   const height = document.body.scrollHeight;
   parent.postMessage(height, '*');  
};
window.addEventListener('load', postHeight);
window.addEventListener('resize', postHeight);`;function CC(e){return{path:e.ffJs,contents:SC}}var wC=`// Once the document is ready
$(document).ready(function ()
{    
    

    // Function to set content for Page Language & Error Message
    // It is kept separate instead of being defined within setFieldData to provide handling in case data is not available in config for received language
    // If data is not available in config for received language, fallbackLanguage will be used
    function setPageContent()
    {
        // HTML Language
        $("html").attr("lang", language.substring(0, language.indexOf("_")));

        // HTML Direction (RTL/LTR)
        var rtlLangs = ["ar", "he", "ku", "fa", "ur", "yi"];
        var langSubtag = language.substring(0, language.indexOf("_"));
        $("html").attr("dir", rtlLangs.indexOf(langSubtag) !== -1 ? "rtl" : "ltr");

        // Error Message container content
        var heading = "",
            subHeading = "",
            subHeadingUrl = "",
            subHeadingUrlText = "";

        try
        {
            heading = page_error[language]["hrErr"]["heading"];

            subHeading = page_error[language]["hrErr"]["subHeading"];

            subHeadingUrl = page_error[language]["hrErr"]["subHeadingUrl"];

            subHeadingUrlText = page_error[language]["hrErr"]["subHeadingUrlText"];
        }
        catch(err)
        {
            heading = page_error[param["fallbackLanguage"]]["hrErr"]["heading"];

            subHeading = page_error[param["fallbackLanguage"]]["hrErr"]["subHeading"];

            subHeadingUrl = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrl"];

            subHeadingUrlText = page_error[param["fallbackLanguage"]]["hrErr"]["subHeadingUrlText"];
        }
        finally
        {
            $("div#hrErr").find("h3").html(heading);

            $("div#hrErr").find("a").attr("href", subHeadingUrl);

            $("div#hrErr").find("a").html(subHeadingUrlText);

            $("div#hrErr").find("p").html(subHeading + $("div#hrErr").find("p").html());
        }
    }
    
    

    

    // Function to check all the Param(s) expected in URL are available or not
    function validateRequiredUrlParam()
    {
        if(recipientId == "" || recipientId == null || recipientId == undefined)
        {
            throw new Error("Recipient Id Missing");
        }
    }

    // Function to get value for passed key from fields JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder
    function setFieldData()
    {
        // Heading
        $("div.top_cont h2").html(fields[language]["headingBeforeBreak"] + $("div.top_cont h2").html() + fields[language]["headingAfterBreak"]);

        // Subheading
        $("div.top_cont p").html($("div.top_cont p").html() + fields[language]["requiredField"]);

        // Profile Field(s)
        $("div.form_top_group").find("div.form_text_bx").each(function()
        {
            // Field Label
            var pFormLabel = $(this).find("p.form_label");
            
            pFormLabel.html(fields[language]["label"][pFormLabel.parent().find("input, select").attr("id")] + pFormLabel.html());

            // Field Placeholder
            $(this).find("input, select").each(function()
            {
                if($(this).attr("placeholder") != undefined)
                {
                    $(this).attr("placeholder", fields[language]["placeholder"][$(this).attr("id")])
                }
            });
        });

        // Privacy Policy & Subscribe
        $("div.form_bottom_group > div.form_bottom_check_group").find("div.form_bottom_check").each(function()
        {
            // Label
            var ckbLabel = $(this).find("label");

            ckbLabel.html(fields[language][ckbLabel.attr("for")] + ckbLabel.html());

            // Link within Label
            var ckbLabelLink = ckbLabel.find("a");

            // Is present
            if(ckbLabelLink.length === 1)
            {
                ckbLabelLink.children("img").attr("alt", fields[language][ckbLabel.attr("for") + "Link"]["imageAlt"]);

                ckbLabelLink.children("img").attr("src", fields[language][ckbLabel.attr("for") + "Link"]["image"]);

                ckbLabelLink.html(fields[language][ckbLabel.attr("for") + "Link"]["label"] + ckbLabelLink.html());

                ckbLabelLink.attr("href", fields[language][ckbLabel.attr("for") + "Link"]["url"]);
            }
        });

        // Submit Button
        $("#btnSubmit").html(fields[language]["submitButton"]);
        
        // Thank You page / section
        $("div#hrTy").find("h3").html(fields[language]["hrTy"]["heading"]);

        $("div#hrTy").find("a").attr("href", fields[language]["hrTy"]["subHeadingUrl"]);

        $("div#hrTy").find("a").html(fields[language]["hrTy"]["subHeadingUrlText"]);

        $("div#hrTy").find("p").html(fields[language]["hrTy"]["subHeading"] + $("div#hrTy").find("p").html());
    }

    // Function to get value for passed key from questions & answers JSON constant variable (present in Translation JS) based on Language AND set it in respective placeholder
    function setQuestionAndAnswerData()
    {
        $("div.form_check_group > div.form_check_module").each(function()
        {
            var questionId = $(this).attr("id");

            // Question
            $(this).find("div.form_check_title h3").html(questions[language][questionId]["heading"] + $(this).find("div.form_check_title h3").html());

            $(this).find("div.form_check_title p").html(questions[language][questionId]["subheading"]);

            // Answer
            $(this).find("input[name='" + questionId + "']").each(function()
            {
                var input = $(this);

                var label = input.next();

                if (label.children().length == 0)
                {
                    // Answer with Text inside <label>
                    label.html(answers[language][questionId][input.val()]);
                }
                else if (label.children().length == 1)
                {
                    // Answer with Text inside <p> (within <label>)
                    label.children("p").html(answers[language][questionId][input.val()]);
                }
                else if (label.children().length == 2)
                {
                    // Answer with Text & Image (within <label>)
                    label.children("p").html(answers[language][questionId][input.val()]["label"]);

                    label.children("img").attr("src", answers[language][questionId][input.val()]["image"]);

                    label.children("img").attr("alt", answers[language][questionId][input.val()]["imageAlt"]);
                }
            });
        });
    }
	
	function setAnswerDataFromparam(q01)
	{
		//isSubmitClicked = true;
		$("#Q1"+q01).prop('checked', true);
	}

    // Function to get value for passed key from validation_messages JSON constant variable (present in Translation JS) based on Language AND set it as respective (Parsley) Validation Message
    function setValidationMessage()
    {
        $("input[data-parsley-error-message], select[data-parsley-error-message]").each(function()
        {
            $(this).attr("data-parsley-error-message", validation_messages[language][$(this).attr("id") + "Error"]);
        });

        $("input[data-parsley-type-message]").each(function()
        {
            $(this).attr("data-parsley-type-message", validation_messages[language][$(this).attr("id") + "Type"]);
        });

        $("input[data-parsley-length-message]").each(function()
        {
            $(this).attr("data-parsley-length-message", validation_messages[language][$(this).attr("id") + "Length"]);
        });

         $("#apiError").html(validation_messages[language]["apiError"]);
        $("#submitIntentPopupMessage1").text(validation_messages[language]["modalMessage_1"]);
        $("#submitIntentPopupMessage2").text(validation_messages[language]["modalMessage_2"]);
        $("#submitIntentPopupYes").text(validation_messages[language]["modalButtonYes"]);
        $("#submitIntentPopupNo").text(validation_messages[language]["modalButtonNo"]);
		
		$("input[data-parsley-mobile-number-by-country-message]").each(function()
        {
            $(this).attr("data-parsley-mobile-number-by-country-message", validation_messages[language][$(this).attr("id") + "Error"]);
        });
    }

    // Function to populate Calling Code dropdown
    function populateCallingCodeDropdown()
    {
        // Get Subsidiary from Country Code (parsed from Language)
        var subsidiary = country_subsidiary[countryCode];

        // Calling Code dropdown
        var ddCallingCode = $("#callingCode");

        // Set Default Value in Calling Code dropdown
        //ddCallingCode.append($("<option></option>").val("0").html(fields[language]["callingCodeDropdownFirstEntry"]));

        // Disable First / Default Entry in Calling Code dropdown
        $("#callingCode option:first-child").attr("disabled", "disabled").prop("selected", true);

        // Set Option(s) in Calling Code dropdown
        $.each(subsidiary_detail[subsidiary], function (val, text)
        {
            // If Calling Code is not blank
            if (text.callingCode != "")
            {
                ddCallingCode.append($("<option></option>").val(text.callingCode).html(text.countryName[language] + " (+" + text.callingCode + ")"));
            }
        });
    }

    // Function to reset selected value in Calling Code dropdown if Mobile Number is removed
    function resetCallingCode()
    {
        if($("#mobileNumber").val() == "")
        {
            // Reset value
            $("#callingCode").val("0");

            // Remove Parsley validation message
            $("#callingCode").parsley().reset();
        }
    }

    // Function to enable Submit button if both Privacy Policy & Subscribe checkboxes are checked (else keep Submit button disabled)
    function enableDisableSubmit()
    {
        if (($("#Q1A1").is(":checked") || $("#Q1A2").is(":checked") ||$("#Q1A3").is(":checked")))
        {
            $("#btnSubmit").prop("disabled", false);

            $("#btnSubmit").removeClass("disabled");
        }
        else
        {
            $("#btnSubmit").prop("disabled", true);

            $("#btnSubmit").addClass("disabled");
        }
    }

    function validateModal()
    {
        // Check whether any questions in the form have been answered
        submitModalAnsweredAny = $('[data-pt-api="y"][name^=Q]').filter((i, el) => el.checked).length > 0;

		//submitModalWithsub = $("#subscribe").is(":checked");
        return !submitModalHasOpened && !submitModalAnsweredAny;
    }

    function closeSubmitModalWithNo()
    {
        if (submitModalElement)
        {
            submitModalElement.removeClass("popup--open");
        }
    }
	
	function closeSubmitModalWithYes()
    {
		$("#subscribe").val("on");
        if (submitModalElement)
        {
            submitModalElement.removeClass("popup--open");
        }
        submitModalHasOpened = false;
    }

    function showSubmitModal(resumeCallback)
    {
        submitModalResume = typeof resumeCallback === "function" ? resumeCallback : null;

        if (!submitModalElement) // Bind events once
        {
            submitModalElement = $("#submitIntentPopup");
            submitModalElement.find("#submitIntentPopupYes, .popup__close, .popup__dimmed").on("click", closeSubmitModal);
            submitModalElement.find("#submitIntentPopupNo").on("click", function ()
            {
                closeSubmitModal();

                if (submitModalResume)
                {
                    submitModalResume();
                    submitModalResume = null;
                }
            });
        }

        submitModalElement.addClass("popup--open");
        submitModalHasOpened = true;
    }

    // Function to attach different event(s) to various element(s)
    function attachEvent()
    {
        // Add Parsley Custom Validator to validate Calling Code (value should be selected in dropdown if Mobile Number is entered)
        window.Parsley.addValidator("requiredIf", {
            validateString : function(value, requirement)
            {
                if($(requirement).parsley().isValid())
                {
                    if (jQuery(requirement).val())
                    {
                        return !!value;
                    }
                }

                return true;
            }
        });

		// Build callingCode -> countryCode mapping from subsidiary_detail
        var callingCodeToCountry = {};
        $.each(subsidiary_detail, function(subsidiary, countries) {
            $.each(countries, function(i, country) {
                if (country.callingCode && country.callingCode !== "") {
                    callingCodeToCountry[country.callingCode] = country.countryCode;
                }
            });
        });

        // Custom Parsley Validator - validate mobile number against selected calling code using libphonenumber-js
        window.Parsley.addValidator("mobileNumberByCountry", {
            validateString: function (value) {
                if (value.trim() === "") return true; // empty value handled by required-if on callingCode

                var callingCode = $("#callingCode").val();
                if (!callingCode || callingCode === "0") return false;

                // Check digit length by country: UAE allows 9 digits, others allow 8
                var trimmedValue = value.replace(/\\s/g, "");
                if (callingCode === "971") {
                    if (trimmedValue.length !== 9) return false;
                } else {
                    if (trimmedValue.length !== 8) return false;
                }

                var fullNumber = "+" + callingCode + value;
                try {
                    var phoneNumber = libphonenumber.parsePhoneNumberFromString(fullNumber);
                    return phoneNumber && phoneNumber.isValid();
                } catch (e) {
                    return false;
                }
            },
            message: "Enter a valid mobile number"
        });
        // Clear / reset user entered data (from Profile fields)
        $(".btn_clear").on("click", function()
        {
            // Parent of element having btn_clear class
            var parent = $(this).parent();

            // Find input field present in parent container (having element with btn_clear class)
            var inputField = parent.find("input");

            // If input field is present
            if (inputField.length === 1)
            {
                // Reset input field value
                inputField.val("");

                // Remove Parsley validation message
                inputField.parsley().reset();

                // Find second parent (parent element's parent) of element having btn_clear class
                var secondParent = parent.parent();

                // Find dropdown field present in secodn parent container
                var ddSelect = secondParent.find("select");

                // If dropdown is present && is dependent on input field
                if((ddSelect.length === 1) && (ddSelect.attr("data-parsley-required-if") != undefined) && (ddSelect.attr("data-parsley-required-if") == ("#" + inputField.attr("id"))))
                {
                    // Reset dropdown value
                    ddSelect.val(secondParent.find("select option:first-child").val());

                    // Remove Parsley validation message
                    ddSelect.parsley().reset();
                }
            }
        });

        // Attach event to reset Calling Code if Mobile Number is removed
        $("#mobileNumber").on("change", resetCallingCode);

        // Attach event to check Submit button state (enabled / disabled) on check / uncheck of Privacy Policy & Subscribe checkboxes
        $("#Q1A1, #Q1A2, #Q1A3").on("change", enableDisableSubmit);
		//$("div.form_bottom_check_group input[type='checkbox'], #Q1A1, #Q1A2, #Q1A3").on("change", enableDisableSubmit);
        // Floating submit button (outside form) — trigger Parsley validation on click
        // $("#btnSubmit").on("click", function ()
        // {
            // var $form = $("#dataForm").parsley();

            // if ($form.isValid())
            // {
                // validateModal() ? showSubmitModal(processValidatedSubmit) : processValidatedSubmit();
            // }
            // else
            // {
                // $form.validate();
            // }
        // });


        // For Calling Code & Mobile Number fields, override Parsley method to change DOM position of validation message
        window.Parsley.on('field:error', function()
        {
            if(this.$element.attr("id") == "callingCode")
            {
                $("#callingCode").parent().prev().after($("#callingCode").next("span.parsley-errors"));
            }

            if(this.$element.attr("id") == "mobileNumber")
            {
                $("#mobileNumber").before($("#mobileNumber").next("span.parsley-errors"));
				// Force red color on mobile number validation errors
                $("#mobileNumber").next("span.parsley-errors").find("span.parsley-error").css("color", "red");
            }
        });
    }

    // Function to carry out task(s) at the start of Form submit process
    function preSubmitProcess()
    {
		//submitFlag = true;
        // Disable Submit button
        $("#btnSubmit").attr("disabled", true).addClass("disabled");

        showOverlay();

        // Hide error message
        $("#apiError").hide();
    }

    // Function to show Overlay (with Loader)
    function showOverlay()
    {
        if( $("#overlay").css("display") == "none")
        {
            $("#overlay").css("display", "block");
        }
    }

    // Function to hide Overlay (with Loader)
    function hideOverlay()
    {
        if( $("#overlay").css("display") == "block")
        {
            $("#overlay").css("display", "none");
        }
    }

    // Function to show div confirming that data was successfully sent to server
    function showSuccess()
    {
        // Hide div having Form fields
        $("div.container_oc").css("display", "none");

        // Empty div (having Form fields)
        $("div.container_oc").empty();

        // Hide div having Error message
        $("#hrErr").css("display", "none");

        // Empty div (having Error message)
        $("#hrErr").empty();

        // Scroll to Top
        window.scrollTo({
        top: 0,
        behavior: "smooth"
        });

        // Show div having Success message
        $("#hrTy").css("display", "block");

        // Set Timeout for Redirection
		window.top.location.href = fields[language]["redirectAfterSuccessUrl"];
        //setTimeout(function (){ window.top.location.href = fields[language]["redirectAfterSuccessUrl"]; }, (parseInt(param["redirectAfterSuccessInSecond"], 10) * 1000));

        hideOverlay();

        // Empty div (having Ovelary with Loader)
        $("#overlay").empty();

        // Adobe Analytics Tracking - Submit Form Event
        if (param?.analytics?.enabled) {
            _satellite.track("submit_form");
        }
    }

    // Function to show div informing about error
    function showError()
    {
        // Hide div having Form fields
        $("div.container_oc").css("display", "none");

        // Empty div (having Form fields)
        $("div.container_oc").empty();

        // Hide div having Success message
        $("#hrTy").css("display", "none");

        // Empty div (having Success message)
        $("#hrTy").empty();

        // Scroll to Top
        window.scrollTo({
        top: 0,
        behavior: "smooth"
        });

        // Show div having Error message
        $("#hrErr").css("display", "block");

        hideOverlay();

        // Empty div (having Ovelary with Loader)
        $("#overlay").empty();
    }

    // Function to parse User Agent to get Platform Type
    function getPlatformType()
    {
        var userAgent = navigator.userAgent.toString();

        var platformType = "web";

        if(!!(window.EcommAndroidClient || window.flutter_inappwebview) || userAgent.indexOf('samsung-mobile-app') > -1)
        {
            platformType = "app";
        }

        return platformType;
    }

    // Function to Identify HHP using Calling Code & Mobile Number
    function identifyHHP(callingCode, mobileNumber)
    {
        var hhp =  "";

        if (callingCode != null && callingCode != "" && mobileNumber != "")
        {
            hhp = (callingCode + mobileNumber);
        }

        return hhp;
    }

    // Function to handle error occurred during API call
    function apiCallErrorHandler(isSubmitClicked)
    {
        if(isSubmitClicked)
        {
            // Show error message
            $("#apiError").show();

            // Enable Submit button so that user can try again
            enableDisableSubmit();

            // Scroll to Bottom
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth"
            });
        }

        hideOverlay();
    }
    

    // Function to Send Data to API
    function sendData(request, isSubmitClicked)
    {
        try
        {
            fetch(param["apiEndpoint"], {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(request)
            })
            .then(response =>
            {
                if(!(response.ok) || response.status != "200")
                {
                    apiCallErrorHandler(isSubmitClicked);
                }
                else
                {
                    if(isSubmitClicked)
                    {
                        showSuccess();
                    }
                    else
                    {
                        hideOverlay();
                    }
                }
            }).
            catch(error =>
            {
                apiCallErrorHandler(isSubmitClicked);
            });
        }
        catch(err)
        {
            apiCallErrorHandler(isSubmitClicked);
        }
    }
 // iOS or MacOS íŒë³„ í•¨ìˆ˜
    function isIOS() {
        var ua = navigator.userAgent || navigator.vendor || window.opera;
        var iOSClassic = /iPhone|iPad|iPod/.test(ua);
        var iPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        var MacOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints <= 1);
        var hasMacUA = /Macintosh/.test(ua) && !iPadOS;
        return iOSClassic || iPadOS || MacOS || hasMacUA;
    }
    // Function to create Request data based on User Input & call method to trigger API
    function mapParam(userResponse, isSubmitClicked)
    {
		if(isSubmitClicked === false ? userResponse["Q1"] = "": userResponse["Q1"] = userResponse["Q1"]);
        var dtmCurrent = new Date();

        var requestBody = {
            app_yn: (getPlatformType() === "app" ? "Y" : "N"),
			channel: ch === "" ? param["channel"]["oneClick"] : ch,
			channel_detail: chd === "" ? param["channelDetail"]["oneClick"] : chd,
            cid: userResponse["campaignId"],
            country_alpha_2: userResponse["countryCode"],
            deliveryId: userResponse["deliveryId"],
            email: userResponse["email"] || "",
            first_name: userResponse["firstName"] || "",
            hhp: identifyHHP(userResponse["callingCode"], userResponse["mobileNumber"]),
            imei: "",
            language: userResponse["language"],
            last_name: userResponse["lastName"] || "",
            mid: "",
            pin_code: userResponse["zipCode"] || "",
            privacy_policy_yn: "Y",//((isSubmitClicked === true) ? (userResponse["privacyPolicy"] === "on" ? "Y" : "N") : "Y"),
            project: param["project"],
            q01Answer: userResponse["Q1"],
            q02Answer: userResponse["Q2"],
            q03Answer: userResponse["Q3"],
            q04Answer: userResponse["Q4"],
            q05Answer: userResponse["Q5"],
            q06Answer: "",
            q07Answer: "",
            q08Answer: "",
            q09Answer: "",
            q10Answer: "",
            q11Answer: "",
            q12Answer: "",
            q13Answer: "",
            q14Answer: "",
            q15Answer: "",
            q16Answer: "",
            q17Answer: "",
            q18Answer: "",
            q19Answer: "",
            q20Answer: "",
            recipientId: userResponse["recipientId"],
            registerDatetime: dtmCurrent.toISOString(),
            source: param["source"]["oneClick"],
            subscribe_yn: "Y",//((isSubmitClicked === true) ? (userResponse["subscribe"] === "on" ? "Y" : "N") : "Y"),
            tm_yn: "",
            uniqueid: dtmCurrent.getTime() + "_" + crypto.randomUUID() + "_" + Math.floor(Math.random() * 1e12).toString().padStart(12, "0"),
            VoucherRequired: param["voucherRequired"],
			oneclickFlag: "Y",
            submitFlag: (isSubmitClicked === true ? "Y" : "N"),
            iosFlag: (isIOS() ? "Y" : "N")
        };

        sendData(requestBody, isSubmitClicked);
    }

    // Function to Process User Input & transfer flow for further processing
    // This methoed will be called:
    // 1 - When the page is viewed - This call will register Recipient as HR (blank / default data will be passed for form fields)
    // 2 - When user clicks the Submit button - This call will send User Response to API
    // Input variable received by this method is to differentiate between the 2 method calls mentioned above
    function processFormData(isSubmitClicked)
    {
        var formElements = document.getElementById("dataForm");

        var elementId,
            elementName,
            objectValue,
            cBrBData = {},
            formData = [],
            elementDataAttr,
            userResponse = {};

        // Process all the Form Fields
        for (i = 0; i < formElements.length; i++)
        {
            if (formElements.elements[i].type != "hidden")
            {
                elementId = formElements.elements[i].id;

                elementName = formElements.elements[i].name;

                elementDataAttr = formElements.elements[i].getAttribute("data-pt-api");

                if (elementDataAttr && elementDataAttr.trim() !== "" && elementDataAttr.trim() === "y")
                {
                    if (formElements.elements[i].type == "radio")
                    {
                        if (!cBrBData[elementName])
                        {
                            cBrBData[elementName] = [];
                        }

                        if ($("#" + elementId).is(":checked"))
                        {
                            cBrBData[elementName].push($("#" + elementId).val());
                        }
                    }
                    else if (formElements.elements[i].type == "checkbox")
                    {
                        if (!cBrBData[elementName])
                        {
                            cBrBData[elementName] = [];
                        }

                        if ($("#" + elementId).is(":checked"))
                        {
                            cBrBData[elementName].push($("#" + elementId).val());
                        }
                    }
                    else
                    {
                        objectValue = $("#" + elementId).val();

                        formData.push({name: elementName, value: objectValue});
                    }
                }
            }
        }

        Object.keys(cBrBData).forEach(function (key)
        {
            formData.push({ name: key, value: cBrBData[key].join("|") });
        });

        // Move data from Array to Key / Value pair
        for (var i=0, len=formData.length; i < len; i++)
        {
            userResponse[formData[i]["name"]] = formData[i]["value"];
        }

        // If Country Code dropdown is present in form, then pick the value from dropdown -- This is already handled above along with other fields (no special handling required).
        // If Country Code dropdown is not present in form, then pick the value from URL (parsed from Language).
        if(userResponse["countryCode"] == null || userResponse["countryCode"] == undefined)
        {
            userResponse["countryCode"] = countryCode;
        }

        // Add data determined earlier (from URL Parameter) to Key / Value pair
        userResponse["campaignId"] = campaignId;

        userResponse["deliveryId"] = deliveryId;

        userResponse["recipientId"] = recipientId;

        userResponse["language"] = language;
		
		userResponse["subscribe"] = $("#subscribe").val();
		
        userResponse["channel"] = ch;

        userResponse["channel_detail"] = chd;

        //userResponse["Q1"] = q01 === "" ? userResponse["Q1"]: q01;

        // Call function to map API Parameter with User Response & send data to server
        mapParam(userResponse, isSubmitClicked);
    }

    try
    {
        showOverlay();

        // Get Parameter Value from URL
        var frameUrlParam = new URLSearchParams(window.location.search);

        var language = frameUrlParam.get("lang") || param["fallbackLanguage"];

        var campaignId = frameUrlParam.get("cid") || "";

        var deliveryId = frameUrlParam.get("did") || "";

        var recipientId = frameUrlParam.get("id") || "";

        var countryCode = language.substring(language.indexOf("_") + 1);

		//Coomment-CEJ-q01 
        var q01 = frameUrlParam.get("q01") || "";	
		
		var ch = frameUrlParam.get("ch") || "";
			
		var chd = frameUrlParam.get("chd") || "";
		
		//var submitFlag = false;

        setPageContent();

        validateRequiredUrlParam();

        setFieldData();

        setQuestionAndAnswerData();

        setValidationMessage();

        populateCallingCodeDropdown();

        attachEvent();
		
		//Coomment-CEJ-q01 
		if(q01 !== "")
		{
			setAnswerDataFromparam(q01);
		}
		
		enableDisableSubmit();

        // Load and display submit modal when form is submitted, or none of answers are selected
        var submitModalElement = null;
        var submitModalResume = null;
        var submitModalHasOpened = false;
        var submitModalAnsweredAny = false;

        // Call method to send data to API and register Recipient as HR
        // Varaible false passed to method call confirms that the Submit button wasn't clicked
		processFormData(false);

        function processValidatedSubmit()
        {
            preSubmitProcess();

            // Varaible true passed to method call confirms that the Submit button wasn clicked
            processFormData(true);
        }

        var parsleyConfig = {
            errorsWrapper: '<span class="parsley-errors"></span>',
            errorTemplate: '<span class="parsley-error"></span>',
            excluded: 'input[type=button], input[type=submit], input[type=reset], input[type=hidden], input[class=noValidate]',
        }

        // Carry out following after the submit button is clicked
        $("#btnSubmit").on("click", function() {
            $("#dataForm").trigger("submit");
        });
        $("form").parsley(parsleyConfig).on("form:submit", function ()
        {
           validateModal() ? showSubmitModal(processValidatedSubmit) : processValidatedSubmit();

           return false;
        });
    }
    catch(err)
    {
        showError();
    }
});

//OC_JS Final Update 08/07/2027 10:30:00 UAE
//All update align with MENAO and SUWON.
//All data tested.
//Commented on 08/07/2027 15:22:00 UAE
//Commented on 14/07/2027 11:22:00 UAE`;function TC(e){return{path:e.ocJs,contents:wC}}function EC(e,t){let n=ZS(e,t),r=t.questionRequired?{...e,questions:e.questions.map(e=>{let n=t.questionRequired?.[e.id];return n===void 0?e:{...e,required:n}})}:e,i=[];return t.variants.includes(`ff`)&&(i.push(pC(r,t,n)),i.push(CC(n))),t.variants.includes(`oc`)&&(i.push(mC(r,t,n)),i.push(TC(n))),i.push(xC(r,t,n)),i.push(JS(n)),i}function DC(){return{variants:[`ff`],apiEndpoint:``,analytics:{enabled:!1},fileNamePrefix:``,faviconUrl:``,customFontsHref:``,project:``,channel:{fullForm:``,oneClick:``},channelDetail:{fullForm:``,oneClick:``},source:{fullForm:``,oneClick:``},voucherRequired:`N`}}var OC=C((e,t)=>({fileName:null,mapResult:null,validation:null,previewLocale:null,config:DC(),step:`upload`,loadError:null,async loadWorkbook(t){if(!eS(t.name)){e({loadError:`"${t.name}" is not a .xlsx or .xls file.`,fileName:null,mapResult:null,validation:null});return}let n=tS(await t.arrayBuffer(),t.name),r=ES(n),i=kS(r,n.issues),a=n.issues.find(e=>e.severity===`error`&&e.sheet===``);e({fileName:t.name,mapResult:r,validation:i,previewLocale:r.form.meta.defaultLocale,step:`preview`,loadError:a?a.message:null})},setPreviewLocale(t){e({previewLocale:t})},setConfig(n){e({config:{...t().config,...n}})},setStep(t){e({step:t})},reset(){e({fileName:null,mapResult:null,validation:null,previewLocale:null,config:DC(),step:`upload`,loadError:null})}})),kC=o((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.fragment`);function r(e,n,r){var i=null;if(r!==void 0&&(i=``+r),n.key!==void 0&&(i=``+n.key),`key`in n)for(var a in r={},n)a!==`key`&&(r[a]=n[a]);else r=n;return n=r.ref,{$$typeof:t,type:e,key:i,ref:n===void 0?null:n,props:r}}e.Fragment=n,e.jsx=r,e.jsxs=r})),Q=o(((e,t)=>{t.exports=kC()}))();function AC(){let e=OC(e=>e.loadWorkbook),t=OC(e=>e.loadError),[n,r]=(0,y.useState)(!1),i=(0,y.useRef)(null);function a(t){let n=t?.[0];n&&e(n)}return(0,Q.jsxs)(`div`,{className:`panel`,children:[(0,Q.jsx)(`h2`,{children:`Upload an Excel workbook`}),(0,Q.jsxs)(`p`,{children:[`Upload a .xlsx or .xls file containing multilingual questions and answers (see the reference format in `,(0,Q.jsx)(`code`,{children:`Documents/`}),`).`]}),(0,Q.jsxs)(`div`,{className:`dropzone${n?` dragover`:``}`,onClick:()=>i.current?.click(),onDragOver:e=>{e.preventDefault(),r(!0)},onDragLeave:()=>r(!1),onDrop:e=>{e.preventDefault(),r(!1),a(e.dataTransfer.files)},children:[(0,Q.jsx)(`p`,{children:`Drag & drop an Excel file here, or click to browse.`}),(0,Q.jsx)(`input`,{ref:i,type:`file`,accept:`.xlsx,.xls`,style:{display:`none`},onChange:e=>a(e.target.files)})]}),t&&(0,Q.jsx)(`p`,{className:`issue-item error`,style:{marginTop:16},children:t})]})}function jC(e,t,n,r){let i=t===`ff`?r.ffHtml:r.ocHtml,a=t===`ff`?r.ffJs:r.ocJs,o=e.find(e=>e.path===i)?.contents,s=e.find(e=>e.path===r.css)?.contents??``,c=e.find(e=>e.path===r.dataJs)?.contents??``,l=e.find(e=>e.path===a)?.contents??``;if(!o)throw Error(`No generated ${i} file to preview.`);let u=`<script>(function(){var L="${n}";var O=window.URLSearchParams;window.URLSearchParams=function(s){var p=new O(s||"");var g=p.get.bind(p);p.get=function(n){return n==="lang"?L:g(n)};return p};window.URLSearchParams.prototype=O.prototype})();<\/script>\n`;return o.replace(`<link rel="stylesheet" href="${r.css}">`,`<style>${s}</style>`).replace(`<script src="${r.dataJs}"><\/script>`,`<script>${c}<\/script>`).replace(`<script src="${a}"><\/script>`,`${u}<script>${l}<\/script>`)}function MC(){let e=OC(e=>e.validation);return e?e.errors.length===0&&e.warnings.length===0?(0,Q.jsx)(`p`,{style:{color:`#2a8a3a`},children:`No issues found — ready to generate.`}):(0,Q.jsxs)(`div`,{children:[e.errors.length>0&&(0,Q.jsxs)(Q.Fragment,{children:[(0,Q.jsx)(`strong`,{children:`Blocking errors (must fix before generating):`}),(0,Q.jsx)(`ul`,{className:`issue-list`,children:e.errors.map((e,t)=>(0,Q.jsxs)(`li`,{className:`issue-item error`,children:[e.sheet?`[${e.sheet}${e.row?` row ${e.row}`:``}] `:``,e.message]},t))})]}),e.warnings.length>0&&(0,Q.jsxs)(Q.Fragment,{children:[(0,Q.jsx)(`strong`,{children:`Warnings:`}),(0,Q.jsx)(`ul`,{className:`issue-list`,children:e.warnings.map((e,t)=>(0,Q.jsxs)(`li`,{className:`issue-item warning`,children:[e.sheet?`[${e.sheet}${e.row?` row ${e.row}`:``}] `:``,e.message]},t))})]})]}):null}function NC(){let e=OC(e=>e.mapResult),t=OC(e=>e.config),n=OC(e=>e.previewLocale),r=OC(e=>e.setPreviewLocale),i=OC(e=>e.setStep),[a,o]=(0,y.useState)(null),s=t.variants[0]??`ff`;return(0,y.useEffect)(()=>{if(!n)return;let r={...t,variants:[s]},i=jC(EC(e.form,r),s,n,ZS(e.form,r)),a=new Blob([i],{type:`text/html`}),c=URL.createObjectURL(a);return o(c),()=>URL.revokeObjectURL(c)},[e,t,s,n]),(0,Q.jsxs)(`div`,{className:`panel`,children:[(0,Q.jsx)(`h2`,{children:`Preview`}),(0,Q.jsx)(MC,{}),(0,Q.jsx)(`div`,{className:`locale-select`,children:e.form.locales.map(e=>(0,Q.jsxs)(`button`,{type:`button`,className:`locale-chip${e.code===n?` active`:``}`,onClick:()=>r(e.code),children:[e.label,` (`,e.code,`)`,e.isRtl?` · RTL`:``]},e.code))}),(0,Q.jsx)(`div`,{className:`preview-frame-wrap`,children:a&&(0,Q.jsx)(`iframe`,{src:a,title:`Form preview`},a)}),(0,Q.jsxs)(`div`,{className:`button-row`,children:[(0,Q.jsx)(`button`,{className:`btn secondary`,onClick:()=>i(`upload`),children:`Back`}),(0,Q.jsx)(`button`,{className:`btn`,onClick:()=>i(`configure`),children:`Continue to Configure`})]})]})}function PC(){let e=OC(e=>e.mapResult),t=OC(e=>e.config),n=OC(e=>e.setConfig),r=OC(e=>e.setStep);function i(e){let r=t.variants.includes(e)?t.variants.filter(t=>t!==e):[...t.variants,e];r.length>0&&n({variants:r})}return(0,Q.jsxs)(`div`,{className:`panel`,children:[(0,Q.jsx)(`h2`,{children:`Configure`}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{children:`Form variant(s) to generate`}),(0,Q.jsxs)(`div`,{className:`checkbox-row`,children:[(0,Q.jsx)(`input`,{type:`checkbox`,id:`variant-ff`,checked:t.variants.includes(`ff`),onChange:()=>i(`ff`)}),(0,Q.jsx)(`label`,{htmlFor:`variant-ff`,children:`Full Form (name, email, phone, questions)`})]}),(0,Q.jsxs)(`div`,{className:`checkbox-row`,children:[(0,Q.jsx)(`input`,{type:`checkbox`,id:`variant-oc`,checked:t.variants.includes(`oc`),onChange:()=>i(`oc`)}),(0,Q.jsx)(`label`,{htmlFor:`variant-oc`,children:`One-Click (phone + questions only)`})]})]}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{htmlFor:`fileNamePrefix`,children:`Output file name prefix (optional)`}),(0,Q.jsx)(`input`,{id:`fileNamePrefix`,type:`text`,placeholder:`Leave blank to derive from the workbook's subsidiary + language (e.g. SEIL-EN)`,value:t.fileNamePrefix??``,onChange:e=>n({fileNamePrefix:e.target.value})})]}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{htmlFor:`faviconUrl`,children:`Favicon URL (optional)`}),(0,Q.jsx)(`input`,{id:`faviconUrl`,type:`text`,placeholder:`Leave blank to omit a favicon tag`,value:t.faviconUrl??``,onChange:e=>n({faviconUrl:e.target.value})})]}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{htmlFor:`customFontsHref`,children:`Custom fonts stylesheet URL (optional)`}),(0,Q.jsx)(`input`,{id:`customFontsHref`,type:`text`,placeholder:`Leave blank to fall back to system fonts`,value:t.customFontsHref??``,onChange:e=>n({customFontsHref:e.target.value})})]}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{htmlFor:`endpoint`,children:`Submission API endpoint (optional)`}),(0,Q.jsx)(`input`,{id:`endpoint`,type:`url`,placeholder:`Leave blank to only validate locally — no real network submission`,value:t.apiEndpoint??``,onChange:e=>n({apiEndpoint:e.target.value})})]}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{htmlFor:`project`,children:`Project code (optional)`}),(0,Q.jsx)(`input`,{id:`project`,type:`text`,placeholder:`Leave blank to omit from the submission payload`,value:t.project??``,onChange:e=>n({project:e.target.value})})]}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{children:`Channel (optional)`}),(0,Q.jsx)(`input`,{type:`text`,placeholder:`Full Form channel`,value:t.channel?.fullForm??``,onChange:e=>n({channel:{...t.channel,fullForm:e.target.value}})}),(0,Q.jsx)(`input`,{type:`text`,placeholder:`One-Click channel`,value:t.channel?.oneClick??``,onChange:e=>n({channel:{...t.channel,oneClick:e.target.value}})})]}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{children:`Channel detail (optional)`}),(0,Q.jsx)(`input`,{type:`text`,placeholder:`Full Form channel detail`,value:t.channelDetail?.fullForm??``,onChange:e=>n({channelDetail:{...t.channelDetail,fullForm:e.target.value}})}),(0,Q.jsx)(`input`,{type:`text`,placeholder:`One-Click channel detail`,value:t.channelDetail?.oneClick??``,onChange:e=>n({channelDetail:{...t.channelDetail,oneClick:e.target.value}})})]}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{children:`Source (optional)`}),(0,Q.jsx)(`input`,{type:`text`,placeholder:`Full Form source`,value:t.source?.fullForm??``,onChange:e=>n({source:{...t.source,fullForm:e.target.value}})}),(0,Q.jsx)(`input`,{type:`text`,placeholder:`One-Click source`,value:t.source?.oneClick??``,onChange:e=>n({source:{...t.source,oneClick:e.target.value}})})]}),(0,Q.jsx)(`div`,{className:`field-row`,children:(0,Q.jsxs)(`div`,{className:`checkbox-row`,children:[(0,Q.jsx)(`input`,{type:`checkbox`,id:`voucherRequired`,checked:t.voucherRequired===`Y`,onChange:e=>n({voucherRequired:e.target.checked?`Y`:`N`})}),(0,Q.jsx)(`label`,{htmlFor:`voucherRequired`,children:`Voucher required`})]})}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsx)(`label`,{children:`Question required status`}),(0,Q.jsxs)(`p`,{style:{fontSize:`0.85em`,color:`#666`,marginBottom:8},children:[`Uncheck to make a question optional (removes the `,(0,Q.jsx)(`span`,{className:`star`,children:`*`}),` marker).`]}),e.form.questions.map(e=>(0,Q.jsxs)(`div`,{className:`checkbox-row`,children:[(0,Q.jsx)(`input`,{type:`checkbox`,id:`q-req-${e.id}`,checked:t.questionRequired?.[e.id]??!0,onChange:r=>n({questionRequired:{...t.questionRequired,[e.id]:r.target.checked}})}),(0,Q.jsxs)(`label`,{htmlFor:`q-req-${e.id}`,children:[e.id,`: `,e.headingByLocale.en_GB||`(no English text)`]})]},e.id))]}),(0,Q.jsxs)(`div`,{className:`field-row`,children:[(0,Q.jsxs)(`div`,{className:`checkbox-row`,children:[(0,Q.jsx)(`input`,{type:`checkbox`,id:`analytics-enabled`,checked:t.analytics?.enabled??!1,onChange:e=>n({analytics:{...t.analytics,enabled:e.target.checked}})}),(0,Q.jsx)(`label`,{htmlFor:`analytics-enabled`,children:`Enable Adobe Analytics/Launch tracking`})]}),t.analytics?.enabled&&(0,Q.jsxs)(Q.Fragment,{children:[(0,Q.jsx)(`input`,{type:`text`,placeholder:`Report Suite ID`,value:t.analytics.reportSuiteID??``,onChange:e=>n({analytics:{...t.analytics,reportSuiteID:e.target.value}})}),(0,Q.jsx)(`input`,{type:`text`,placeholder:`IMS Org ID`,value:t.analytics.imsOrgID??``,onChange:e=>n({analytics:{...t.analytics,imsOrgID:e.target.value}})}),(0,Q.jsx)(`input`,{type:`text`,placeholder:`Datastream ID`,value:t.analytics.datastreamID??``,onChange:e=>n({analytics:{...t.analytics,datastreamID:e.target.value}})})]})]}),(0,Q.jsxs)(`div`,{className:`button-row`,children:[(0,Q.jsx)(`button`,{className:`btn secondary`,onClick:()=>r(`preview`),children:`Back`}),(0,Q.jsx)(`button`,{className:`btn`,onClick:()=>r(`generate`),children:`Continue to Generate`})]})]})}var FC=Uint8Array,IC=Uint16Array,LC=Int32Array,RC=new FC([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),zC=new FC([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),BC=new FC([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),VC=function(e,t){for(var n=new IC(31),r=0;r<31;++r)n[r]=t+=1<<e[r-1];for(var i=new LC(n[30]),r=1;r<30;++r)for(var a=n[r];a<n[r+1];++a)i[a]=a-n[r]<<5|r;return{b:n,r:i}},HC=VC(RC,2),UC=HC.b,WC=HC.r;UC[28]=258,WC[258]=28;var GC=VC(zC,0);GC.b;for(var KC=GC.r,qC=new IC(32768),JC=0;JC<32768;++JC){var YC=(JC&43690)>>1|(JC&21845)<<1;YC=(YC&52428)>>2|(YC&13107)<<2,YC=(YC&61680)>>4|(YC&3855)<<4,qC[JC]=((YC&65280)>>8|(YC&255)<<8)>>1}for(var XC=(function(e,t,n){for(var r=e.length,i=0,a=new IC(t);i<r;++i)e[i]&&++a[e[i]-1];var o=new IC(t);for(i=1;i<t;++i)o[i]=o[i-1]+a[i-1]<<1;var s;if(n){s=new IC(1<<t);var c=15-t;for(i=0;i<r;++i)if(e[i])for(var l=i<<4|e[i],u=t-e[i],d=o[e[i]-1]++<<u,f=d|(1<<u)-1;d<=f;++d)s[qC[d]>>c]=l}else for(s=new IC(r),i=0;i<r;++i)e[i]&&(s[i]=qC[o[e[i]-1]++]>>15-e[i]);return s}),ZC=new FC(288),JC=0;JC<144;++JC)ZC[JC]=8;for(var JC=144;JC<256;++JC)ZC[JC]=9;for(var JC=256;JC<280;++JC)ZC[JC]=7;for(var JC=280;JC<288;++JC)ZC[JC]=8;for(var QC=new FC(32),JC=0;JC<32;++JC)QC[JC]=5;var $C=XC(ZC,9,0),ew=XC(QC,5,0),tw=function(e){return(e+7)/8|0},nw=function(e,t,n){return(t==null||t<0)&&(t=0),(n==null||n>e.length)&&(n=e.length),new FC(e.subarray(t,n))},rw=[`unexpected EOF`,`invalid block type`,`invalid length/literal`,`invalid distance`,`stream finished`,`no stream handler`,,`no callback`,`invalid UTF-8 data`,`extra field too long`,`date not in range 1980-2099`,`filename too long`,`stream finishing`,`invalid zip data`],iw=function(e,t,n){var r=Error(t||rw[e]);if(r.code=e,Error.captureStackTrace&&Error.captureStackTrace(r,iw),!n)throw r;return r},aw=function(e,t,n){n<<=t&7;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8},ow=function(e,t,n){n<<=t&7;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8,e[r+2]|=n>>16},sw=function(e,t){for(var n=[],r=0;r<e.length;++r)e[r]&&n.push({s:r,f:e[r]});var i=n.length,a=n.slice();if(!i)return{t:mw,l:0};if(i==1){var o=new FC(n[0].s+1);return o[n[0].s]=1,{t:o,l:1}}n.sort(function(e,t){return e.f-t.f}),n.push({s:-1,f:25001});var s=n[0],c=n[1],l=0,u=1,d=2;for(n[0]={s:-1,f:s.f+c.f,l:s,r:c};u!=i-1;)s=n[n[l].f<n[d].f?l++:d++],c=n[l!=u&&n[l].f<n[d].f?l++:d++],n[u++]={s:-1,f:s.f+c.f,l:s,r:c};for(var f=a[0].s,r=1;r<i;++r)a[r].s>f&&(f=a[r].s);var p=new IC(f+1),m=cw(n[u-1],p,0);if(m>t){var r=0,h=0,g=m-t,_=1<<g;for(a.sort(function(e,t){return p[t.s]-p[e.s]||e.f-t.f});r<i;++r){var v=a[r].s;if(p[v]>t)h+=_-(1<<m-p[v]),p[v]=t;else break}for(h>>=g;h>0;){var y=a[r].s;p[y]<t?h-=1<<t-p[y]++-1:++r}for(;r>=0&&h;--r){var b=a[r].s;p[b]==t&&(--p[b],++h)}m=t}return{t:new FC(p),l:m}},cw=function(e,t,n){return e.s==-1?Math.max(cw(e.l,t,n+1),cw(e.r,t,n+1)):t[e.s]=n},lw=function(e){for(var t=e.length;t&&!e[--t];);for(var n=new IC(++t),r=0,i=e[0],a=1,o=function(e){n[r++]=e},s=1;s<=t;++s)if(e[s]==i&&s!=t)++a;else{if(!i&&a>2){for(;a>138;a-=138)o(32754);a>2&&(o(a>10?a-11<<5|28690:a-3<<5|12305),a=0)}else if(a>3){for(o(i),--a;a>6;a-=6)o(8304);a>2&&(o(a-3<<5|8208),a=0)}for(;a--;)o(i);a=1,i=e[s]}return{c:n.subarray(0,r),n:t}},uw=function(e,t){for(var n=0,r=0;r<t.length;++r)n+=e[r]*t[r];return n},dw=function(e,t,n){var r=n.length,i=tw(t+2);e[i]=r&255,e[i+1]=r>>8,e[i+2]=e[i]^255,e[i+3]=e[i+1]^255;for(var a=0;a<r;++a)e[i+a+4]=n[a];return(i+4+r)*8},fw=function(e,t,n,r,i,a,o,s,c,l,u){aw(t,u++,n),++i[256];for(var d=sw(i,15),f=d.t,p=d.l,m=sw(a,15),h=m.t,g=m.l,_=lw(f),v=_.c,y=_.n,b=lw(h),x=b.c,S=b.n,C=new IC(19),w=0;w<v.length;++w)++C[v[w]&31];for(var w=0;w<x.length;++w)++C[x[w]&31];for(var T=sw(C,7),E=T.t,D=T.l,O=19;O>4&&!E[BC[O-1]];--O);var k=l+5<<3,A=uw(i,ZC)+uw(a,QC)+o,j=uw(i,f)+uw(a,h)+o+14+3*O+uw(C,E)+2*C[16]+3*C[17]+7*C[18];if(c>=0&&k<=A&&k<=j)return dw(t,u,e.subarray(c,c+l));var M,N,P,ee;if(aw(t,u,1+(j<A)),u+=2,j<A){M=XC(f,p,0),N=f,P=XC(h,g,0),ee=h;var F=XC(E,D,0);aw(t,u,y-257),aw(t,u+5,S-1),aw(t,u+10,O-4),u+=14;for(var w=0;w<O;++w)aw(t,u+3*w,E[BC[w]]);u+=3*O;for(var I=[v,x],te=0;te<2;++te)for(var ne=I[te],w=0;w<ne.length;++w){var L=ne[w]&31;aw(t,u,F[L]),u+=E[L],L>15&&(aw(t,u,ne[w]>>5&127),u+=ne[w]>>12)}}else M=$C,N=ZC,P=ew,ee=QC;for(var w=0;w<s;++w){var R=r[w];if(R>255){var L=R>>18&31;ow(t,u,M[L+257]),u+=N[L+257],L>7&&(aw(t,u,R>>23&31),u+=RC[L]);var z=R&31;ow(t,u,P[z]),u+=ee[z],z>3&&(ow(t,u,R>>5&8191),u+=zC[z])}else ow(t,u,M[R]),u+=N[R]}return ow(t,u,M[256]),u+N[256]},pw=new LC([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),mw=new FC(0),hw=function(e,t,n,r,i,a){var o=a.z||e.length,s=new FC(r+o+5*(1+Math.ceil(o/7e3))+i),c=s.subarray(r,s.length-i),l=a.l,u=(a.r||0)&7;if(t){u&&(c[0]=a.r>>3);for(var d=pw[t-1],f=d>>13,p=d&8191,m=(1<<n)-1,h=a.p||new IC(32768),g=a.h||new IC(m+1),_=Math.ceil(n/3),v=2*_,y=function(t){return(e[t]^e[t+1]<<_^e[t+2]<<v)&m},b=new LC(25e3),x=new IC(288),S=new IC(32),C=0,w=0,T=a.i||0,E=0,D=a.w||0,O=0;T+2<o;++T){var k=y(T),A=T&32767,j=g[k];if(h[A]=j,g[k]=A,D<=T){var M=o-T;if((C>7e3||E>24576)&&(M>423||!l)){u=fw(e,c,0,b,x,S,w,E,O,T-O,u),E=C=w=0,O=T;for(var N=0;N<286;++N)x[N]=0;for(var N=0;N<30;++N)S[N]=0}var P=2,ee=0,F=p,I=A-j&32767;if(M>2&&k==y(T-I))for(var te=Math.min(f,M)-1,ne=Math.min(32767,T),L=Math.min(258,M);I<=ne&&--F&&A!=j;){if(e[T+P]==e[T+P-I]){for(var R=0;R<L&&e[T+R]==e[T+R-I];++R);if(R>P){if(P=R,ee=I,R>te)break;for(var z=Math.min(I,R-2),B=0,N=0;N<z;++N){var V=T-I+N&32767,re=V-h[V]&32767;re>B&&(B=re,j=V)}}}A=j,j=h[A],I+=A-j&32767}if(ee){b[E++]=268435456|WC[P]<<18|KC[ee];var H=WC[P]&31,U=KC[ee]&31;w+=RC[H]+zC[U],++x[257+H],++S[U],D=T+P,++C}else b[E++]=e[T],++x[e[T]]}}for(T=Math.max(T,D);T<o;++T)b[E++]=e[T],++x[e[T]];u=fw(e,c,l,b,x,S,w,E,O,T-O,u),l||(a.r=u&7|c[u/8|0]<<3,u-=7,a.h=g,a.p=h,a.i=T,a.w=D)}else{for(var T=a.w||0;T<o+l;T+=65535){var ie=T+65535;ie>=o&&(c[u/8|0]=l,ie=o),u=dw(c,u+1,e.subarray(T,ie))}a.i=o}return nw(s,0,r+tw(u)+i)},gw=(function(){for(var e=new Int32Array(256),t=0;t<256;++t){for(var n=t,r=9;--r;)n=(n&1&&-306674912)^n>>>1;e[t]=n}return e})(),_w=function(){var e=-1;return{p:function(t){for(var n=e,r=0;r<t.length;++r)n=gw[n&255^t[r]]^n>>>8;e=n},d:function(){return~e}}},vw=function(e,t,n,r,i){if(!i&&(i={l:1},t.dictionary)){var a=t.dictionary.subarray(-32768),o=new FC(a.length+e.length);o.set(a),o.set(e,a.length),e=o,i.w=a.length}return hw(e,t.level==null?6:t.level,t.mem==null?i.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+t.mem,n,r,i)},yw=function(e,t){var n={};for(var r in e)n[r]=e[r];for(var r in t)n[r]=t[r];return n},bw=function(e,t,n){for(;n;++t)e[t]=n,n>>>=8};function xw(e,t){return vw(e,t||{},0,0)}var Sw=function(e,t,n,r){for(var i in e){var a=e[i],o=t+i,s=r;Array.isArray(a)&&(s=yw(r,a[1]),a=a[0]),ArrayBuffer.isView(a)?n[o]=[a,s]:(n[o+=`/`]=[new FC(0),s],Sw(a,o,n,r))}},Cw=typeof TextEncoder<`u`&&new TextEncoder,ww=typeof TextDecoder<`u`&&new TextDecoder;try{ww.decode(mw,{stream:!0})}catch{}function Tw(e,t){if(t){for(var n=new FC(e.length),r=0;r<e.length;++r)n[r]=e.charCodeAt(r);return n}if(Cw)return Cw.encode(e);for(var i=e.length,a=new FC(e.length+(e.length>>1)),o=0,s=function(e){a[o++]=e},r=0;r<i;++r){if(o+5>a.length){var c=new FC(o+8+(i-r<<1));c.set(a),a=c}var l=e.charCodeAt(r);l<128||t?s(l):l<2048?(s(192|l>>6),s(128|l&63)):l>55295&&l<57344?(l=65536+(l&1047552)|e.charCodeAt(++r)&1023,s(240|l>>18),s(128|l>>12&63),s(128|l>>6&63),s(128|l&63)):(s(224|l>>12),s(128|l>>6&63),s(128|l&63))}return nw(a,0,o)}var Ew=function(e){var t=0;if(e)for(var n in e){var r=e[n].length;r>65535&&iw(9),t+=r+4}return t},Dw=function(e,t,n,r,i,a,o,s){var c=r.length,l=n.extra,u=s&&s.length,d=Ew(l);bw(e,t,o==null?67324752:33639248),t+=4,o!=null&&(e[t++]=20,e[t++]=n.os),e[t]=20,t+=2,e[t++]=n.flag<<1|(a<0&&8),e[t++]=i&&8,e[t++]=n.compression&255,e[t++]=n.compression>>8;var f=new Date(n.mtime==null?Date.now():n.mtime),p=f.getFullYear()-1980;if((p<0||p>119)&&iw(10),bw(e,t,p<<25|f.getMonth()+1<<21|f.getDate()<<16|f.getHours()<<11|f.getMinutes()<<5|f.getSeconds()>>1),t+=4,a!=-1&&(bw(e,t,n.crc),bw(e,t+4,a<0?-a-2:a),bw(e,t+8,n.size)),bw(e,t+12,c),bw(e,t+14,d),t+=16,o!=null&&(bw(e,t,u),bw(e,t+6,n.attrs),bw(e,t+10,o),t+=14),e.set(r,t),t+=c,d)for(var m in l){var h=l[m],g=h.length;bw(e,t,+m),bw(e,t+2,g),e.set(h,t+4),t+=4+g}return u&&(e.set(s,t),t+=u),t},Ow=function(e,t,n,r,i){bw(e,t,101010256),bw(e,t+8,n),bw(e,t+10,n),bw(e,t+12,r),bw(e,t+16,i)};function kw(e,t){t||={};var n={},r=[];Sw(e,``,n,t);var i=0,a=0;for(var o in n){var s=n[o],c=s[0],l=s[1],u=l.level==0?0:8,d=Tw(o),f=d.length,p=l.comment,m=p&&Tw(p),h=m&&m.length,g=Ew(l.extra);f>65535&&iw(11);var _=u?xw(c,l):c,v=_.length,y=_w();y.p(c),r.push(yw(l,{size:c.length,crc:y.d(),c:_,f:d,m,u:f!=o.length||m&&p.length!=h,o:i,compression:u})),i+=30+f+g+v,a+=76+2*(f+g)+(h||0)+v}for(var b=new FC(a+22),x=i,S=a-i,C=0;C<r.length;++C){var d=r[C];Dw(b,d.o,d,d.f,d.u,d.c.length);var w=30+d.f.length+Ew(d.extra);b.set(d.c,d.o+w),Dw(b,i,d,d.f,d.u,d.c.length,d.o,d.m),i+=16+w+(d.m?d.m.length:0)}return Ow(b,i,r.length,S,x),b}function Aw(e,t){let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(n)}function jw(e,t=`form-solution.zip`){let n={};for(let t of e)n[t.path]=Tw(t.contents);let r=kw(n);Aw(new Blob([r],{type:`application/zip`}),t)}function Mw(){let e=OC(e=>e.mapResult),t=OC(e=>e.validation),n=OC(e=>e.config),r=OC(e=>e.setStep),i=OC(e=>e.reset),a=t.errors.length===0;function o(){let t=EC(e.form,n),{prefix:r}=ZS(e.form,n);jw(t,`${r}.zip`)}return(0,Q.jsxs)(`div`,{className:`panel`,children:[(0,Q.jsx)(`h2`,{children:`Generate`}),(0,Q.jsxs)(`ul`,{className:`summary-list`,children:[(0,Q.jsxs)(`li`,{children:[`Languages: `,e.form.locales.map(e=>e.code).join(`, `)]}),(0,Q.jsxs)(`li`,{children:[`Questions: `,e.form.questions.length]}),(0,Q.jsxs)(`li`,{children:[`Required questions:`,` `,e.form.questions.filter(e=>n.questionRequired?.[e.id]??!0).map(e=>e.id).join(`, `)||`none`]}),(0,Q.jsxs)(`li`,{children:[`Variants: `,n.variants.join(`, `)]}),(0,Q.jsxs)(`li`,{children:[`Submission endpoint: `,n.apiEndpoint||`(none — local validation only)`]}),(0,Q.jsxs)(`li`,{children:[`Analytics: `,n.analytics?.enabled?`enabled`:`disabled`]})]}),!a&&(0,Q.jsxs)(`p`,{className:`issue-item error`,children:[t.errors.length,` blocking error(s) must be resolved before generating. Go back to Preview to review them.`]}),(0,Q.jsxs)(`div`,{className:`button-row`,children:[(0,Q.jsx)(`button`,{className:`btn secondary`,onClick:()=>r(`configure`),children:`Back`}),(0,Q.jsx)(`button`,{className:`btn`,disabled:!a,onClick:o,children:`Generate & Download .zip`}),(0,Q.jsx)(`button`,{className:`btn secondary`,onClick:i,children:`Start Over`})]})]})}var Nw=[{id:`upload`,label:`1. Upload`},{id:`preview`,label:`2. Preview`},{id:`configure`,label:`3. Configure`},{id:`generate`,label:`4. Generate`}];function Pw(){let e=OC(e=>e.step),t=OC(e=>e.mapResult);return(0,Q.jsxs)(`div`,{className:`app-shell`,children:[(0,Q.jsxs)(`header`,{className:`app-header`,children:[(0,Q.jsx)(`h1`,{children:`Form Builder`}),(0,Q.jsx)(`nav`,{className:`wizard-steps`,children:Nw.map(t=>(0,Q.jsx)(`span`,{className:`wizard-step${t.id===e?` active`:``}`,children:t.label},t.id))})]}),e===`upload`&&(0,Q.jsx)(AC,{}),e===`preview`&&t&&(0,Q.jsx)(NC,{}),e===`configure`&&t&&(0,Q.jsx)(PC,{}),e===`generate`&&t&&(0,Q.jsx)(Mw,{})]})}function Fw(){return(0,Q.jsx)(Pw,{})}(0,w.createRoot)(document.getElementById(`root`)).render((0,Q.jsx)(y.StrictMode,{children:(0,Q.jsx)(Fw,{})}));