/*
 * The MIT License
 * Copyright (c) 2019- Nordic Institute for Interoperability Solutions (NIIS)
 * Copyright (c) 2018 Estonian Information System Authority (RIA),
 * Nordic Institute for Interoperability Solutions (NIIS), Population Register Centre (VRK)
 * Copyright (c) 2015-2017 Estonian Information System Authority (RIA), Population Register Centre (VRK)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import axiosAuth from '../../axios-auth';
import axios from 'axios';
import { ActionTree, GetterTree, Module, MutationTree } from 'vuex';
import { RouteConfig } from 'vue-router';
import { RootState } from '../types';
import {
  InitializationStatus,
  SecurityServer,
  TokenInitStatus,
  User,
  VersionInfo,
} from '@/openapi-types';
import { Tab } from '@/ui-types';
import { mainTabs } from '@/global';
import routes from '@/routes';
import i18n from '@/i18n';

export interface UserState {
  authenticated: boolean;
  isSessionAlive: boolean | undefined;
  permissions: string[];
  username: string;
  currentSecurityServer: SecurityServer | Record<string, unknown>;
  securityServerVersion: VersionInfo | Record<string, unknown>;
  initializationStatus: InitializationStatus | undefined;
  bannedRoutes: undefined | string[];
}

export const getDefaultState = (): UserState => {
  return {
    authenticated: false,
    isSessionAlive: undefined,
    permissions: [],
    username: '',
    currentSecurityServer: {},
    securityServerVersion: {},
    initializationStatus: undefined,
    bannedRoutes: undefined, // Array for routes the user doesn't have permission to access.
  };
};

// Initial state. The state can be reseted with this.
const moduleState = getDefaultState();

export const userGetters: GetterTree<UserState, RootState> = {
  isAuthenticated(state) {
    return state.authenticated;
  },
  isSessionAlive(state) {
    return state.isSessionAlive;
  },
  firstAllowedTab(state, getters) {
    return getters.getAllowedTabs(mainTabs)[0];
  },
  permissions(state) {
    return state.permissions;
  },
  hasPermission: (state) => (perm: string) => {
    return state.permissions.includes(perm);
  },
  hasAnyOfPermissions: (state) => (perm: string[]) => {
    // Return true if the user has at least one of the tabs permissions
    return perm.some((permission) => state.permissions.includes(permission));
  },
  getAllowedTabs: (state) => (tabs: Tab[]) => {
    // returns filtered array of Tab objects based on the 'permission' attribute
    const filteredTabs = tabs.filter((tab: Tab) => {
      const routeName = tab.to.name;

      if (routeName && !state.bannedRoutes?.includes(routeName)) {
        // Return true if the user has permission
        return true;
      }
      return false;
    });

    return filteredTabs;
  },
  username(state) {
    return state.username;
  },
  currentSecurityServer(state) {
    return state.currentSecurityServer;
  },
  securityServerVersion(state) {
    return state.securityServerVersion;
  },
  isAnchorImported(state): boolean {
    return state.initializationStatus?.is_anchor_imported ?? false;
  },

  isServerOwnerInitialized(state): boolean {
    return state.initializationStatus?.is_server_owner_initialized ?? false;
  },

  isServerCodeInitialized(state): boolean {
    return state.initializationStatus?.is_server_code_initialized ?? false;
  },

  softwareTokenInitializationStatus(state): TokenInitStatus | undefined {
    return state.initializationStatus?.software_token_init_status;
  },

  hasInitState: (state: UserState) => {
    return typeof state.initializationStatus !== 'undefined';
  },

  needsInitialization: (state) => {
    return !(
      state.initializationStatus?.is_anchor_imported &&
      state.initializationStatus.is_server_code_initialized &&
      state.initializationStatus.is_server_owner_initialized &&
      (state.initializationStatus.software_token_init_status ===
        TokenInitStatus.INITIALIZED ||
        state.initializationStatus.software_token_init_status ===
          TokenInitStatus.UNKNOWN)
    );
  },
};

export const mutations: MutationTree<UserState> = {
  authUser(state) {
    state.authenticated = true;
  },
  setSessionAlive(state, value: boolean) {
    state.isSessionAlive = value;
  },
  clearAuthData(state) {
    Object.assign(state, getDefaultState());
  },
  setPermissions: (state, permissions: string[]) => {
    state.permissions = permissions;

    // Function for checking routes recursively
    function getAllowed(route: RouteConfig): void {
      if (!state.bannedRoutes) return;

      // Check that the route has name and permissions
      if (route.name && route?.meta?.permissions) {
        // Find out routes that the user doesn't have permissions to access
        if (
          !route.meta.permissions.some((permission: string) =>
            permissions.includes(permission),
          )
        ) {
          // Add a banned route to the array
          state.bannedRoutes.push(route.name);
        }
      }

      // Check the child routes recursively
      if (route.children) {
        route.children.forEach((child: RouteConfig) => {
          getAllowed(child);
        });
      }
    }

    // Init banned routes array
    state.bannedRoutes = [];
    // Go through the route permissions
    routes.forEach((route) => {
      getAllowed(route);
    });
  },
  setUsername: (state, username: string) => {
    state.username = username;
  },
  setCurrentSecurityServer: (state, securityServer: SecurityServer) => {
    state.currentSecurityServer = securityServer;
  },
  setSecurityServerVersion: (state, version: VersionInfo) => {
    state.securityServerVersion = version;
  },
  storeInitStatus(state, status: InitializationStatus) {
    state.initializationStatus = status;
  },
};

export const actions: ActionTree<UserState, RootState> = {
  login({ commit }, authData) {
    const data = `username=${encodeURIComponent(
      authData.username,
    )}&password=${encodeURIComponent(authData.password)}`;

    return axiosAuth({
      url: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data,
    })
      .then(() => {
        commit('authUser');
        commit('setSessionAlive', true);
      })
      .catch((error) => {
        throw error;
      });
  },

  async isSessionAlive({ commit }) {
    return axios
      .get('/notifications/session-status')
      .then((res) => {
        commit('setSessionAlive', res?.data?.valid ?? false);
      })
      .catch(() => {
        commit('setSessionAlive', false);
      });
  },

  async fetchUserData({ commit }) {
    return axios
      .get<User>('/user')
      .then((res) => {
        commit('setUsername', res.data.username);
        commit('setPermissions', res.data.permissions);
      })
      .catch((error) => {
        throw error;
      });
  },

  async fetchCurrentSecurityServer({ commit }) {
    return axios
      .get<SecurityServer[]>('/security-servers?current_server=true')
      .then((resp) => {
        if (resp.data?.length !== 1) {
          throw new Error(
            i18n.t('stores.user.currentSecurityServerNotFound') as string,
          );
        }
        commit('setCurrentSecurityServer', resp.data[0]);
      })
      .catch((error) => {
        throw error;
      });
  },

  async fetchSecurityServerVersion({ commit }) {
    return axios
      .get<VersionInfo>('/system/version')
      .then((resp) => commit('setSecurityServerVersion', resp.data))
      .catch((error) => {
        throw error;
      });
  },

  logout({ commit }, reload = true) {
    // Clear auth data
    commit('clearAuthData');

    // Call backend for logout
    axiosAuth
      .post('/logout')
      .catch(() => {
        // Nothing to do
      })
      .finally(() => {
        if (reload) {
          // Reload the browser page to clean up the memory
          location.reload();
        }
      });
  },

  fetchInitializationStatus({ commit }) {
    return axios
      .get('/initialization/status')
      .then((resp) => {
        commit('storeInitStatus', resp.data);
      })
      .catch((error) => {
        throw error;
      });
  },

  setInitializationStatus({ commit }) {
    // Sets the initialization state to done
    const initStatus: InitializationStatus = {
      is_anchor_imported: true,
      is_server_code_initialized: true,
      is_server_owner_initialized: true,
      software_token_init_status: TokenInitStatus.INITIALIZED,
    };

    commit('storeInitStatus', initStatus);
  },

  clearAuth({ commit }) {
    commit('clearAuthData');
  },
};

export const user: Module<UserState, RootState> = {
  namespaced: false,
  state: moduleState,
  getters: userGetters,
  actions,
  mutations,
};
