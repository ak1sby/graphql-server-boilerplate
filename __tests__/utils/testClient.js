import request from 'request-promise';

class TestClient {
  constructor(url) {
    this.url = url;
    this.options = {
      withCredentials: true,
      jar: request.jar(),
      json: true
    };
  }

  async register(email, password) {
    return request.post(this.url, {
      ...this.options,
      body: {
        query: `
          mutation {
            register(email: "${email}", password: "${password}") {
              path
              message
            }
          }
        `
      }
    });
  }

  async login(email, password) {
    return request.post(this.url, {
      ...this.options,
      body: {
        query: `
        mutation {
          login(email: "${email}", password: "${password}") {
            path
            message
          }
        }
        `
      }
    });
  }

  async self() {
    return request.post(this.url, {
      ...this.options,
      body: {
        query: `
          {
            self {
              id
              email
            }
          }
        `
      }
    });
  }

  async logout() {
    return request.post(this.url, {
      ...this.options,
      body: {
        query: `
        mutation {
          logout {
            path
            message
          }
        }
        `
      }
    });
  }

  async getKey(email) {
    return request.post(this.url, {
      ...this.options,
      body: {
        query: `
        mutation {
          getKey(email: "${email}") {
            path
            message
          }
        }
        `
      }
    });
  }

  async changePassword(password, key) {
    return request.post(this.url, {
      ...this.options,
      body: {
        query: `
        mutation {
          changePassword(key: "${key}", password: "${password}") {
            path
            message
          }
        }
        `
      }
    });
  }
}

export default TestClient;
