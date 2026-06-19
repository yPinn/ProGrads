import { envelopeToApiError, networkToApiError } from "~/utils/api-error";

// $fetch instance bound to the API base URL. Normalizes both failure modes into a typed
// ApiError: backend error envelopes ({ error: { code, message } }) keep their stable code;
// transport failures (no response) surface as "NETWORK". See docs/05-api-conventions.md.
export default defineNuxtPlugin(() => {
  const { apiBaseUrl } = useRuntimeConfig().public;

  const api = $fetch.create({
    baseURL: apiBaseUrl,
    onResponseError({ response }) {
      throw envelopeToApiError(response._data, response.statusText, response.status);
    },
    onRequestError({ error }) {
      throw networkToApiError(error);
    },
  });

  return { provide: { api } };
});
