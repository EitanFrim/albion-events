"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=E%3A%5CDownloads%5Calbion-events%5Calbion-events%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=E%3A%5CDownloads%5Calbion-events%5Calbion-events&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=E%3A%5CDownloads%5Calbion-events%5Calbion-events%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=E%3A%5CDownloads%5Calbion-events%5Calbion-events&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   headerHooks: () => (/* binding */ headerHooks),\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage),\n/* harmony export */   staticGenerationBailout: () => (/* binding */ staticGenerationBailout)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var E_Downloads_albion_events_albion_events_src_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/[...nextauth]/route.ts */ \"(rsc)/./src/app/api/auth/[...nextauth]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"E:\\\\Downloads\\\\albion-events\\\\albion-events\\\\src\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.ts\",\n    nextConfigOutput,\n    userland: E_Downloads_albion_events_albion_events_src_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks, headerHooks, staticGenerationBailout } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLnRzJmFwcERpcj1FJTNBJTVDRG93bmxvYWRzJTVDYWxiaW9uLWV2ZW50cyU1Q2FsYmlvbi1ldmVudHMlNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUUlM0ElNUNEb3dubG9hZHMlNUNhbGJpb24tZXZlbnRzJTVDYWxiaW9uLWV2ZW50cyZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBc0c7QUFDdkM7QUFDYztBQUN5QztBQUN0SDtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHVHQUF1RztBQUMvRztBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzZKOztBQUU3SiIsInNvdXJjZXMiOlsid2VicGFjazovL2FsYmlvbi1ldmVudHMvPzlhMDMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiRTpcXFxcRG93bmxvYWRzXFxcXGFsYmlvbi1ldmVudHNcXFxcYWxiaW9uLWV2ZW50c1xcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiRTpcXFxcRG93bmxvYWRzXFxcXGFsYmlvbi1ldmVudHNcXFxcYWxiaW9uLWV2ZW50c1xcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgaGVhZGVySG9va3MsIHN0YXRpY0dlbmVyYXRpb25CYWlsb3V0IH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIGhlYWRlckhvb2tzLCBzdGF0aWNHZW5lcmF0aW9uQmFpbG91dCwgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=E%3A%5CDownloads%5Calbion-events%5Calbion-events%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=E%3A%5CDownloads%5Calbion-events%5Calbion-events&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/auth/[...nextauth]/route.ts":
/*!*************************************************!*\
  !*** ./src/app/api/auth/[...nextauth]/route.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n\n\nconst handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()(_lib_auth__WEBPACK_IMPORTED_MODULE_1__.authOptions);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBZ0M7QUFDUTtBQUV4QyxNQUFNRSxVQUFVRixnREFBUUEsQ0FBQ0Msa0RBQVdBO0FBQ00iLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hbGJpb24tZXZlbnRzLy4vc3JjL2FwcC9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlLnRzPzAwOTgiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE5leHRBdXRoIGZyb20gJ25leHQtYXV0aCdcbmltcG9ydCB7IGF1dGhPcHRpb25zIH0gZnJvbSAnQC9saWIvYXV0aCdcblxuY29uc3QgaGFuZGxlciA9IE5leHRBdXRoKGF1dGhPcHRpb25zKVxuZXhwb3J0IHsgaGFuZGxlciBhcyBHRVQsIGhhbmRsZXIgYXMgUE9TVCB9XG4iXSwibmFtZXMiOlsiTmV4dEF1dGgiLCJhdXRoT3B0aW9ucyIsImhhbmRsZXIiLCJHRVQiLCJQT1NUIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/[...nextauth]/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_discord__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/discord */ \"(rsc)/./node_modules/next-auth/providers/discord.js\");\n/* harmony import */ var _prisma__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\nconst authOptions = {\n    providers: [\n        (0,next_auth_providers_discord__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            clientId: process.env.DISCORD_CLIENT_ID,\n            clientSecret: process.env.DISCORD_CLIENT_SECRET,\n            authorization: {\n                params: {\n                    scope: \"identify\"\n                }\n            }\n        })\n    ],\n    callbacks: {\n        async signIn ({ user, account, profile }) {\n            if (!account || account.provider !== \"discord\") return false;\n            const discordProfile = profile;\n            await _prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.user.upsert({\n                where: {\n                    discordUserId: discordProfile.id\n                },\n                update: {\n                    discordName: discordProfile.username,\n                    avatarUrl: user.image ?? null\n                },\n                create: {\n                    discordUserId: discordProfile.id,\n                    discordName: discordProfile.username,\n                    avatarUrl: user.image ?? null,\n                    role: \"PLAYER\"\n                }\n            });\n            return true;\n        },\n        async jwt ({ token, account, profile }) {\n            // On initial login, look up and store the DB user id directly in the token\n            if (account && profile) {\n                const discordProfile = profile;\n                token.discordId = discordProfile.id;\n                const dbUser = await _prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.user.findUnique({\n                    where: {\n                        discordUserId: discordProfile.id\n                    }\n                });\n                if (dbUser) token.dbUserId = dbUser.id;\n            }\n            // Repair stale tokens that have discordId but no dbUserId\n            if (!token.dbUserId && token.discordId) {\n                const dbUser = await _prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.user.findUnique({\n                    where: {\n                        discordUserId: token.discordId\n                    }\n                });\n                if (dbUser) token.dbUserId = dbUser.id;\n            }\n            // Last resort: try token.sub (NextAuth sets it to the provider account ID)\n            if (!token.dbUserId && !token.discordId && token.sub) {\n                token.discordId = token.sub;\n                const dbUser = await _prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.user.findUnique({\n                    where: {\n                        discordUserId: token.sub\n                    }\n                });\n                if (dbUser) token.dbUserId = dbUser.id;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                // Use the stored DB user id directly — no extra DB query needed\n                if (token.dbUserId) {\n                    const dbUser = await _prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.user.findUnique({\n                        where: {\n                            id: token.dbUserId\n                        }\n                    });\n                    if (dbUser) {\n                        session.user.id = dbUser.id;\n                        session.user.discordId = dbUser.discordUserId;\n                        session.user.discordName = dbUser.discordName;\n                        session.user.role = dbUser.role;\n                        session.user.inGameName = dbUser.inGameName;\n                    }\n                } else if (token.discordId) {\n                    // Fallback for tokens without dbUserId\n                    const dbUser = await _prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.user.findUnique({\n                        where: {\n                            discordUserId: token.discordId\n                        }\n                    });\n                    if (dbUser) {\n                        session.user.id = dbUser.id;\n                        session.user.discordId = dbUser.discordUserId;\n                        session.user.discordName = dbUser.discordName;\n                        session.user.role = dbUser.role;\n                        session.user.inGameName = dbUser.inGameName;\n                    }\n                }\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/auth/signin\"\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O3dCQUMzQmUsUUFBUXZCLElBQUksQ0FBQ2tCLFNBQVMsR0FBR0MsT0FBT1osYUFBYTt3QkFDN0NnQixRQUFRdkIsSUFBSSxDQUFDVSxXQUFXLEdBQUdTLE9BQU9ULFdBQVc7d0JBQzdDYSxRQUFRdkIsSUFBSSxDQUFDZSxJQUFJLEdBQUdJLE9BQU9KLElBQUk7d0JBQy9CUSxRQUFRdkIsSUFBSSxDQUFDd0IsVUFBVSxHQUFHTCxPQUFPSyxVQUFVO29CQUM3QztnQkFDRixPQUFPLElBQUlQLE1BQU1DLFNBQVMsRUFBRTtvQkFDMUIsdUNBQXVDO29CQUN2QyxNQUFNQyxTQUFTLE1BQU1qQywyQ0FBTUEsQ0FBQ2MsSUFBSSxDQUFDb0IsVUFBVSxDQUFDO3dCQUFFZCxPQUFPOzRCQUFFQyxlQUFlVSxNQUFNQyxTQUFTO3dCQUFXO29CQUFFO29CQUNsRyxJQUFJQyxRQUFRO3dCQUNWSSxRQUFRdkIsSUFBSSxDQUFDUSxFQUFFLEdBQUdXLE9BQU9YLEVBQUU7d0JBQzNCZSxRQUFRdkIsSUFBSSxDQUFDa0IsU0FBUyxHQUFHQyxPQUFPWixhQUFhO3dCQUM3Q2dCLFFBQVF2QixJQUFJLENBQUNVLFdBQVcsR0FBR1MsT0FBT1QsV0FBVzt3QkFDN0NhLFFBQVF2QixJQUFJLENBQUNlLElBQUksR0FBR0ksT0FBT0osSUFBSTt3QkFDL0JRLFFBQVF2QixJQUFJLENBQUN3QixVQUFVLEdBQUdMLE9BQU9LLFVBQVU7b0JBQzdDO2dCQUNGO1lBQ0Y7WUFDQSxPQUFPRDtRQUNUO0lBQ0Y7SUFDQUUsT0FBTztRQUNMMUIsUUFBUTtJQUNWO0FBQ0YsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2FsYmlvbi1ldmVudHMvLi9zcmMvbGliL2F1dGgudHM/NjY5MiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0QXV0aE9wdGlvbnMgfSBmcm9tICduZXh0LWF1dGgnXG5pbXBvcnQgRGlzY29yZFByb3ZpZGVyIGZyb20gJ25leHQtYXV0aC9wcm92aWRlcnMvZGlzY29yZCdcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gJy4vcHJpc21hJ1xuXG5leHBvcnQgY29uc3QgYXV0aE9wdGlvbnM6IE5leHRBdXRoT3B0aW9ucyA9IHtcbiAgcHJvdmlkZXJzOiBbXG4gICAgRGlzY29yZFByb3ZpZGVyKHtcbiAgICAgIGNsaWVudElkOiBwcm9jZXNzLmVudi5ESVNDT1JEX0NMSUVOVF9JRCEsXG4gICAgICBjbGllbnRTZWNyZXQ6IHByb2Nlc3MuZW52LkRJU0NPUkRfQ0xJRU5UX1NFQ1JFVCEsXG4gICAgICBhdXRob3JpemF0aW9uOiB7IHBhcmFtczogeyBzY29wZTogJ2lkZW50aWZ5JyB9IH0sXG4gICAgfSksXG4gIF0sXG4gIGNhbGxiYWNrczoge1xuICAgIGFzeW5jIHNpZ25Jbih7IHVzZXIsIGFjY291bnQsIHByb2ZpbGUgfSkge1xuICAgICAgaWYgKCFhY2NvdW50IHx8IGFjY291bnQucHJvdmlkZXIgIT09ICdkaXNjb3JkJykgcmV0dXJuIGZhbHNlXG4gICAgICBjb25zdCBkaXNjb3JkUHJvZmlsZSA9IHByb2ZpbGUgYXMgYW55XG5cbiAgICAgIGF3YWl0IHByaXNtYS51c2VyLnVwc2VydCh7XG4gICAgICAgIHdoZXJlOiB7IGRpc2NvcmRVc2VySWQ6IGRpc2NvcmRQcm9maWxlLmlkIH0sXG4gICAgICAgIHVwZGF0ZToge1xuICAgICAgICAgIGRpc2NvcmROYW1lOiBkaXNjb3JkUHJvZmlsZS51c2VybmFtZSxcbiAgICAgICAgICBhdmF0YXJVcmw6IHVzZXIuaW1hZ2UgPz8gbnVsbCxcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlOiB7XG4gICAgICAgICAgZGlzY29yZFVzZXJJZDogZGlzY29yZFByb2ZpbGUuaWQsXG4gICAgICAgICAgZGlzY29yZE5hbWU6IGRpc2NvcmRQcm9maWxlLnVzZXJuYW1lLFxuICAgICAgICAgIGF2YXRhclVybDogdXNlci5pbWFnZSA/PyBudWxsLFxuICAgICAgICAgIHJvbGU6ICdQTEFZRVInLFxuICAgICAgICB9LFxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuXG4gICAgYXN5bmMgand0KHsgdG9rZW4sIGFjY291bnQsIHByb2ZpbGUgfSkge1xuICAgICAgLy8gT24gaW5pdGlhbCBsb2dpbiwgbG9vayB1cCBhbmQgc3RvcmUgdGhlIERCIHVzZXIgaWQgZGlyZWN0bHkgaW4gdGhlIHRva2VuXG4gICAgICBpZiAoYWNjb3VudCAmJiBwcm9maWxlKSB7XG4gICAgICAgIGNvbnN0IGRpc2NvcmRQcm9maWxlID0gcHJvZmlsZSBhcyBhbnlcbiAgICAgICAgdG9rZW4uZGlzY29yZElkID0gZGlzY29yZFByb2ZpbGUuaWRcbiAgICAgICAgY29uc3QgZGJVc2VyID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7IHdoZXJlOiB7IGRpc2NvcmRVc2VySWQ6IGRpc2NvcmRQcm9maWxlLmlkIH0gfSlcbiAgICAgICAgaWYgKGRiVXNlcikgdG9rZW4uZGJVc2VySWQgPSBkYlVzZXIuaWRcbiAgICAgIH1cblxuICAgICAgLy8gUmVwYWlyIHN0YWxlIHRva2VucyB0aGF0IGhhdmUgZGlzY29yZElkIGJ1dCBubyBkYlVzZXJJZFxuICAgICAgaWYgKCF0b2tlbi5kYlVzZXJJZCAmJiB0b2tlbi5kaXNjb3JkSWQpIHtcbiAgICAgICAgY29uc3QgZGJVc2VyID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7IHdoZXJlOiB7IGRpc2NvcmRVc2VySWQ6IHRva2VuLmRpc2NvcmRJZCBhcyBzdHJpbmcgfSB9KVxuICAgICAgICBpZiAoZGJVc2VyKSB0b2tlbi5kYlVzZXJJZCA9IGRiVXNlci5pZFxuICAgICAgfVxuXG4gICAgICAvLyBMYXN0IHJlc29ydDogdHJ5IHRva2VuLnN1YiAoTmV4dEF1dGggc2V0cyBpdCB0byB0aGUgcHJvdmlkZXIgYWNjb3VudCBJRClcbiAgICAgIGlmICghdG9rZW4uZGJVc2VySWQgJiYgIXRva2VuLmRpc2NvcmRJZCAmJiB0b2tlbi5zdWIpIHtcbiAgICAgICAgdG9rZW4uZGlzY29yZElkID0gdG9rZW4uc3ViXG4gICAgICAgIGNvbnN0IGRiVXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBkaXNjb3JkVXNlcklkOiB0b2tlbi5zdWIgfSB9KVxuICAgICAgICBpZiAoZGJVc2VyKSB0b2tlbi5kYlVzZXJJZCA9IGRiVXNlci5pZFxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdG9rZW5cbiAgICB9LFxuXG4gICAgYXN5bmMgc2Vzc2lvbih7IHNlc3Npb24sIHRva2VuIH0pIHtcbiAgICAgIGlmIChzZXNzaW9uLnVzZXIpIHtcbiAgICAgICAgLy8gVXNlIHRoZSBzdG9yZWQgREIgdXNlciBpZCBkaXJlY3RseSDigJQgbm8gZXh0cmEgREIgcXVlcnkgbmVlZGVkXG4gICAgICAgIGlmICh0b2tlbi5kYlVzZXJJZCkge1xuICAgICAgICAgIGNvbnN0IGRiVXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBpZDogdG9rZW4uZGJVc2VySWQgYXMgc3RyaW5nIH0gfSlcbiAgICAgICAgICBpZiAoZGJVc2VyKSB7XG4gICAgICAgICAgICBzZXNzaW9uLnVzZXIuaWQgPSBkYlVzZXIuaWRcbiAgICAgICAgICAgIHNlc3Npb24udXNlci5kaXNjb3JkSWQgPSBkYlVzZXIuZGlzY29yZFVzZXJJZFxuICAgICAgICAgICAgc2Vzc2lvbi51c2VyLmRpc2NvcmROYW1lID0gZGJVc2VyLmRpc2NvcmROYW1lXG4gICAgICAgICAgICBzZXNzaW9uLnVzZXIucm9sZSA9IGRiVXNlci5yb2xlXG4gICAgICAgICAgICBzZXNzaW9uLnVzZXIuaW5HYW1lTmFtZSA9IGRiVXNlci5pbkdhbWVOYW1lXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRva2VuLmRpc2NvcmRJZCkge1xuICAgICAgICAgIC8vIEZhbGxiYWNrIGZvciB0b2tlbnMgd2l0aG91dCBkYlVzZXJJZFxuICAgICAgICAgIGNvbnN0IGRiVXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBkaXNjb3JkVXNlcklkOiB0b2tlbi5kaXNjb3JkSWQgYXMgc3RyaW5nIH0gfSlcbiAgICAgICAgICBpZiAoZGJVc2VyKSB7XG4gICAgICAgICAgICBzZXNzaW9uLnVzZXIuaWQgPSBkYlVzZXIuaWRcbiAgICAgICAgICAgIHNlc3Npb24udXNlci5kaXNjb3JkSWQgPSBkYlVzZXIuZGlzY29yZFVzZXJJZFxuICAgICAgICAgICAgc2Vzc2lvbi51c2VyLmRpc2NvcmROYW1lID0gZGJVc2VyLmRpc2NvcmROYW1lXG4gICAgICAgICAgICBzZXNzaW9uLnVzZXIucm9sZSA9IGRiVXNlci5yb2xlXG4gICAgICAgICAgICBzZXNzaW9uLnVzZXIuaW5HYW1lTmFtZSA9IGRiVXNlci5pbkdhbWVOYW1lXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gc2Vzc2lvblxuICAgIH0sXG4gIH0sXG4gIHBhZ2VzOiB7XG4gICAgc2lnbkluOiAnL2F1dGgvc2lnbmluJyxcbiAgfSxcbn1cbiJdLCJuYW1lcyI6WyJEaXNjb3JkUHJvdmlkZXIiLCJwcmlzbWEiLCJhdXRoT3B0aW9ucyIsInByb3ZpZGVycyIsImNsaWVudElkIiwicHJvY2VzcyIsImVudiIsIkRJU0NPUkRfQ0xJRU5UX0lEIiwiY2xpZW50U2VjcmV0IiwiRElTQ09SRF9DTElFTlRfU0VDUkVUIiwiYXV0aG9yaXphdGlvbiIsInBhcmFtcyIsInNjb3BlIiwiY2FsbGJhY2tzIiwic2lnbkluIiwidXNlciIsImFjY291bnQiLCJwcm9maWxlIiwicHJvdmlkZXIiLCJkaXNjb3JkUHJvZmlsZSIsInVwc2VydCIsIndoZXJlIiwiZGlzY29yZFVzZXJJZCIsImlkIiwidXBkYXRlIiwiZGlzY29yZE5hbWUiLCJ1c2VybmFtZSIsImF2YXRhclVybCIsImltYWdlIiwiY3JlYXRlIiwicm9sZSIsImp3dCIsInRva2VuIiwiZGlzY29yZElkIiwiZGJVc2VyIiwiZmluZFVuaXF1ZSIsImRiVXNlcklkIiwic3ViIiwic2Vzc2lvbiIsImluR2FtZU5hbWUiLCJwYWdlcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log:  true ? [\n        \"error\",\n        \"warn\"\n    ] : 0\n});\nif (true) globalForPrisma.prisma = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBNkM7QUFFN0MsTUFBTUMsa0JBQWtCQztBQUlqQixNQUFNQyxTQUNYRixnQkFBZ0JFLE1BQU0sSUFDdEIsSUFBSUgsd0RBQVlBLENBQUM7SUFDZkksS0FBS0MsS0FBeUIsR0FBZ0I7UUFBQztRQUFTO0tBQU8sR0FBRyxDQUFTO0FBQzdFLEdBQUU7QUFFSixJQUFJQSxJQUF5QixFQUFjSixnQkFBZ0JFLE1BQU0sR0FBR0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hbGJpb24tZXZlbnRzLy4vc3JjL2xpYi9wcmlzbWEudHM/MDFkNyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCdcblxuY29uc3QgZ2xvYmFsRm9yUHJpc21hID0gZ2xvYmFsVGhpcyBhcyB1bmtub3duIGFzIHtcbiAgcHJpc21hOiBQcmlzbWFDbGllbnQgfCB1bmRlZmluZWRcbn1cblxuZXhwb3J0IGNvbnN0IHByaXNtYSA9XG4gIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPz9cbiAgbmV3IFByaXNtYUNsaWVudCh7XG4gICAgbG9nOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyA/IFsnZXJyb3InLCAnd2FybiddIDogWydlcnJvciddLFxuICB9KVxuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA9IHByaXNtYVxuIl0sIm5hbWVzIjpbIlByaXNtYUNsaWVudCIsImdsb2JhbEZvclByaXNtYSIsImdsb2JhbFRoaXMiLCJwcmlzbWEiLCJsb2ciLCJwcm9jZXNzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/preact-render-to-string","vendor-chunks/uuid","vendor-chunks/cookie","vendor-chunks/oidc-token-hash","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=E%3A%5CDownloads%5Calbion-events%5Calbion-events%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=E%3A%5CDownloads%5Calbion-events%5Calbion-events&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();