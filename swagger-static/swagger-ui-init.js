
window.onload = function() {
  // Build a system
  let url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  let options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "paths": {
      "/api": {
        "get": {
          "operationId": "AppController_getHello",
          "parameters": [],
          "responses": {
            "200": {
              "description": "",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "string"
                  }
                }
              }
            }
          },
          "tags": [
            "App"
          ]
        }
      },
      "/api/testing/all-data": {
        "delete": {
          "description": "Removes all data from blogs, posts, comments, likes, and users collections.",
          "operationId": "TestingController_deleteAllData",
          "parameters": [],
          "responses": {
            "204": {
              "description": "All data is deleted successfully"
            },
            "500": {
              "description": "Internal server error occurred while deleting data"
            }
          },
          "summary": "Clear database: delete all data from all tables/collections",
          "tags": [
            "Testing"
          ]
        }
      },
      "/api/sa/users/{id}": {
        "get": {
          "operationId": "UsersController_getById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UserViewDto"
                  }
                }
              }
            },
            "404": {
              "description": "User not found"
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Returns user by id",
          "tags": [
            "Users"
          ]
        },
        "put": {
          "operationId": "UsersController_updateUser",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateUserInputDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UserViewDto"
                  }
                }
              }
            },
            "404": {
              "description": "User not found"
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Update existing user",
          "tags": [
            "Users"
          ]
        },
        "delete": {
          "operationId": "UsersController_deleteUser",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "User deleted successfully"
            },
            "404": {
              "description": "User not found"
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Delete user specified by id",
          "tags": [
            "Users"
          ]
        }
      },
      "/api/sa/users": {
        "get": {
          "operationId": "UsersController_getAll",
          "parameters": [
            {
              "name": "pageNumber",
              "required": false,
              "in": "query",
              "description": "pageNumber is number of portions that should be returned",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "pageSize is portions size that should be returned",
              "schema": {
                "minimum": 1,
                "maximum": 50,
                "default": 10,
                "type": "number"
              }
            },
            {
              "name": "sortDirection",
              "required": false,
              "in": "query",
              "description": "Default value: desc",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "sortBy",
              "required": false,
              "in": "query",
              "description": "Default value: createdAt",
              "schema": {
                "default": "createdAt",
                "type": "string",
                "enum": [
                  "createdAt",
                  "login",
                  "email"
                ]
              }
            },
            {
              "name": "searchLoginTerm",
              "required": false,
              "in": "query",
              "description": "Search term for user Login: Login should contains this term in any position",
              "schema": {
                "nullable": true,
                "default": null,
                "type": "string"
              }
            },
            {
              "name": "searchEmailTerm",
              "required": false,
              "in": "query",
              "description": "Search term for user Email: Email should contains this term in any position",
              "schema": {
                "nullable": true,
                "default": null,
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Returns all users",
          "tags": [
            "Users"
          ]
        },
        "post": {
          "operationId": "UsersController_createUser",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateUserInputDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UserViewDto"
                  }
                }
              }
            },
            "400": {
              "description": "Bad request - validation errors"
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Add new user to the system",
          "tags": [
            "Users"
          ]
        }
      },
      "/api/auth/registration": {
        "post": {
          "operationId": "AuthController_registration",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateUserInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Input data is accepted. Email with confirmation code will be send to passed email address"
            },
            "400": {
              "description": "If the inputModel has incorrect values (in particular if the user with the given email or login already exists)"
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds"
            }
          },
          "summary": "Registration in the system. Email with confirmation code will be send to passed email address",
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/auth/registration-confirmation": {
        "post": {
          "operationId": "AuthController_registrationConfirmation",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RegistrationConfirmationInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Email was verified. Account was activated"
            },
            "400": {
              "description": "If the confirmation code is incorrect, expired or already been applied"
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds"
            }
          },
          "summary": "Confirm registration",
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/auth/registration-email-resending": {
        "post": {
          "operationId": "AuthController_registrationEmailResending",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RegistrationEmailResendingInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Input data is accepted.Email with confirmation code will be send to passed email address.Confirmation code should be inside link as query param, for example: https://some-front.com/confirm-registration?code=youtcodehere"
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds"
            }
          },
          "summary": "Resend confirmation registration Email if user exists",
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/auth/password-recovery": {
        "post": {
          "operationId": "AuthController_passwordRecovery",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PasswordRecoveryInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Even if current email is not registered (for prevent user's email detection)"
            },
            "400": {
              "description": "If the inputModel has invalid email (for example 222^gmail.com)"
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds"
            }
          },
          "summary": "Password recovery via Email confirmation. Email should be sent with RecoveryCode inside",
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/auth/new-password": {
        "post": {
          "operationId": "AuthController_newPassword",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NewPasswordInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "If code is valid and new password is accepted"
            },
            "400": {
              "description": "If the inputModel has incorrect value (for incorrect password length) or RecoveryCode is incorrect or expired"
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds"
            }
          },
          "summary": "Confirm Password recovery",
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/auth/login": {
        "post": {
          "operationId": "AuthController_login",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "loginOrEmail": {
                      "type": "string",
                      "example": "login123"
                    },
                    "password": {
                      "type": "string",
                      "example": "superpassword"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Returns JWT accessToken (expired after 10 seconds) in body and JWT refreshToken in cookie (http-only, secure) (expired after 20 seconds)."
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "If the password or login or email is wrong"
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds"
            }
          },
          "summary": "Try login user to the system",
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/auth/refresh-token": {
        "post": {
          "operationId": "AuthController_refreshToken",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Returns JWT accessToken (expired after 10 seconds) in body and JWT refreshToken in cookie (http-only, secure) (expired after 20 seconds)."
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "refreshToken": []
            }
          ],
          "summary": "Generate new pair of access and refresh tokens (in cookie client must send correct refreshToken that will be revoked after refreshing). Device LastActiveDate should be overrode by issued Date of new refresh token",
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/auth/logout": {
        "post": {
          "operationId": "AuthController_logout",
          "parameters": [],
          "responses": {
            "204": {
              "description": "No Content"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "refreshToken": []
            }
          ],
          "summary": "In cookie client must send correct refreshToken that will be revoked",
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/auth/me": {
        "get": {
          "operationId": "AuthController_me",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Success"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Get information about current user",
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/auth/me-or-default": {
        "get": {
          "operationId": "AuthController_meOrDefault",
          "parameters": [],
          "responses": {
            "200": {
              "description": "",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object"
                  }
                }
              }
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "tags": [
            "Auth"
          ]
        }
      },
      "/api/security/devices": {
        "get": {
          "operationId": "SecurityDevicesController_getAllDevices",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Success",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/DeviceViewDto"
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "refreshToken": []
            }
          ],
          "summary": "Returns all devices with active sessions for current user",
          "tags": [
            "SecurityDevices"
          ]
        },
        "delete": {
          "operationId": "SecurityDevicesController_terminateAllOtherSessions",
          "parameters": [],
          "responses": {
            "204": {
              "description": "No Content"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "refreshToken": []
            }
          ],
          "summary": "Terminate all other (exclude current) device's sessions",
          "tags": [
            "SecurityDevices"
          ]
        }
      },
      "/api/security/devices/{deviceId}": {
        "delete": {
          "operationId": "SecurityDevicesController_terminateDeviceSession",
          "parameters": [
            {
              "name": "deviceId",
              "required": true,
              "in": "path",
              "description": "Id of session that will be terminated",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "No Content"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "If try to delete the deviceId of other user"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "security": [
            {
              "refreshToken": []
            }
          ],
          "summary": "Terminate specified device session",
          "tags": [
            "SecurityDevices"
          ]
        }
      },
      "/api/blogs": {
        "get": {
          "operationId": "BlogsController_getBlogs",
          "parameters": [
            {
              "name": "pageNumber",
              "required": false,
              "in": "query",
              "description": "pageNumber is number of portions that should be returned",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "pageSize is portions size that should be returned",
              "schema": {
                "minimum": 1,
                "maximum": 50,
                "default": 10,
                "type": "number"
              }
            },
            {
              "name": "sortDirection",
              "required": false,
              "in": "query",
              "description": "Default value: desc",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "sortBy",
              "required": false,
              "in": "query",
              "description": "Field to sort by",
              "schema": {
                "default": "createdAt",
                "type": "string"
              }
            },
            {
              "name": "searchNameTerm",
              "required": false,
              "in": "query",
              "description": "Search term for blog Name: Name should contains this term in any position",
              "schema": {
                "nullable": true,
                "default": null,
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            }
          },
          "summary": "Returns blogs with paging",
          "tags": [
            "Blogs"
          ]
        },
        "post": {
          "operationId": "BlogsController_createBlog",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateBlogInputDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Returns the newly created blog"
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "basic": []
            }
          ],
          "summary": "Create new blog",
          "tags": [
            "Blogs"
          ]
        }
      },
      "/api/blogs/{id}": {
        "get": {
          "operationId": "BlogsController_getBlogById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "summary": "Returns blog by id",
          "tags": [
            "Blogs"
          ]
        },
        "put": {
          "operationId": "BlogsController_updateBlog",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateBlogInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "No Content"
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "security": [
            {
              "basic": []
            }
          ],
          "summary": "Update existing Blog by id with InputModel",
          "tags": [
            "Blogs"
          ]
        },
        "delete": {
          "operationId": "BlogsController_deleteBlog",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "No Content"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "security": [
            {
              "basic": []
            }
          ],
          "summary": "Delete blog specified by id",
          "tags": [
            "Blogs"
          ]
        }
      },
      "/api/blogs/{blogId}/posts": {
        "get": {
          "operationId": "BlogsController_getPostsByBlogId",
          "parameters": [
            {
              "name": "blogId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageNumber",
              "required": false,
              "in": "query",
              "description": "pageNumber is number of portions that should be returned",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "pageSize is portions size that should be returned",
              "schema": {
                "minimum": 1,
                "maximum": 50,
                "default": 10,
                "type": "number"
              }
            },
            {
              "name": "sortDirection",
              "required": false,
              "in": "query",
              "description": "Default value: desc",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "sortBy",
              "required": false,
              "in": "query",
              "description": "Field to sort by",
              "schema": {
                "default": "createdAt",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            },
            "404": {
              "description": "If specificied blog is not exists"
            }
          },
          "summary": "Returns all posts for specified blog",
          "tags": [
            "Blogs"
          ]
        },
        "post": {
          "operationId": "BlogsController_createPostByBlogId",
          "parameters": [
            {
              "name": "blogId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreatePostByBlogIdInputDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Returns the newly created post"
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "If specified blog doesn't exists"
            }
          },
          "security": [
            {
              "basic": []
            }
          ],
          "summary": "Create new post for specific blog",
          "tags": [
            "Blogs"
          ]
        }
      },
      "/api/posts": {
        "get": {
          "operationId": "PostsController_getPosts",
          "parameters": [
            {
              "name": "pageNumber",
              "required": false,
              "in": "query",
              "description": "pageNumber is number of portions that should be returned",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "pageSize is portions size that should be returned",
              "schema": {
                "minimum": 1,
                "maximum": 50,
                "default": 10,
                "type": "number"
              }
            },
            {
              "name": "sortDirection",
              "required": false,
              "in": "query",
              "description": "Default value: desc",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "sortBy",
              "required": false,
              "in": "query",
              "description": "Field to sort by",
              "schema": {
                "default": "createdAt",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            }
          },
          "summary": "Returns all posts",
          "tags": [
            "Posts"
          ]
        },
        "post": {
          "operationId": "PostsController_createPost",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreatePostInputDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Returns the newly created post"
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "basic": []
            }
          ],
          "summary": "Create new post",
          "tags": [
            "Posts"
          ]
        }
      },
      "/api/posts/{id}": {
        "get": {
          "operationId": "PostsController_getPostById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "summary": "Return post by id",
          "tags": [
            "Posts"
          ]
        },
        "put": {
          "operationId": "PostsController_updatePost",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdatePostInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "No Content"
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "security": [
            {
              "basic": []
            }
          ],
          "summary": "Update existing post by id with InputModel",
          "tags": [
            "Posts"
          ]
        },
        "delete": {
          "operationId": "PostsController_deletePost",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "No Content"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "security": [
            {
              "basic": []
            }
          ],
          "summary": "Delete post specified by id",
          "tags": [
            "Posts"
          ]
        }
      },
      "/api/posts/{postId}/comments": {
        "get": {
          "operationId": "PostsController_getCommentsByPost",
          "parameters": [
            {
              "name": "postId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "pageNumber",
              "required": false,
              "in": "query",
              "description": "pageNumber is number of portions that should be returned",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": false,
              "in": "query",
              "description": "pageSize is portions size that should be returned",
              "schema": {
                "minimum": 1,
                "maximum": 50,
                "default": 10,
                "type": "number"
              }
            },
            {
              "name": "sortDirection",
              "required": false,
              "in": "query",
              "description": "Default value: desc",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "sortBy",
              "required": false,
              "in": "query",
              "description": "Field to sort by",
              "schema": {
                "default": "createdAt",
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            },
            "404": {
              "description": "If post for passed postId doesn't exist"
            }
          },
          "summary": "Returns comments for specified post",
          "tags": [
            "Posts"
          ]
        },
        "post": {
          "operationId": "PostsController_createComment",
          "parameters": [
            {
              "name": "postId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateCommentInputDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Returns the newly created post"
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "If post with specified postId doesn't exists"
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Create new comment",
          "tags": [
            "Posts"
          ]
        }
      },
      "/api/posts/{postId}/like-status": {
        "put": {
          "operationId": "PostsController_updatePostLikeStatus",
          "parameters": [
            {
              "name": "postId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LikeInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": ""
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "If post with specified postId doesn't exists"
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Make like/unlike/dislike/undislike operation",
          "tags": [
            "Posts"
          ]
        }
      },
      "/api/comments/{id}": {
        "get": {
          "operationId": "CommentsController_getComment",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Success"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "summary": "Return comment by id",
          "tags": [
            "Comments"
          ]
        }
      },
      "/api/comments/{commentId}": {
        "put": {
          "operationId": "CommentsController_updateComment",
          "parameters": [
            {
              "name": "commentId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateCommentInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "No Content"
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "If try edit the comment that is not your own"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Update existing comment by id with InputModel",
          "tags": [
            "Comments"
          ]
        },
        "delete": {
          "operationId": "CommentsController_deleteComment",
          "parameters": [
            {
              "name": "commentId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "No Content"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "If try delete the comment that is not your own"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Delete comment specified by id",
          "tags": [
            "Comments"
          ]
        }
      },
      "/api/comments/{commentId}/like-status": {
        "put": {
          "operationId": "CommentsController_updateCommentLikeStatus",
          "parameters": [
            {
              "name": "commentId",
              "required": true,
              "in": "path",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LikeInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": ""
            },
            "400": {
              "description": "If the inputModel has incorrect values"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "If comment with specified id doesn't exists"
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Make like/unlike/dislike/undislike operation",
          "tags": [
            "Comments"
          ]
        }
      }
    },
    "info": {
      "title": "BLOGGER API",
      "description": "",
      "version": "1.0",
      "contact": {}
    },
    "tags": [],
    "servers": [],
    "components": {
      "securitySchemes": {
        "bearer": {
          "scheme": "bearer",
          "bearerFormat": "JWT",
          "type": "http"
        },
        "basicAuth": {
          "type": "http",
          "scheme": "basic",
          "name": "basic",
          "description": "Basic Authentication"
        }
      },
      "schemas": {
        "UserViewDto": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "login": {
              "type": "string"
            },
            "email": {
              "type": "string"
            },
            "createdAt": {
              "type": "string"
            },
            "firstName": {
              "type": "string",
              "nullable": true
            },
            "lastName": {
              "type": "string",
              "nullable": true
            }
          },
          "required": [
            "id",
            "login",
            "email",
            "createdAt",
            "firstName",
            "lastName"
          ]
        },
        "CreateUserInputDto": {
          "type": "object",
          "properties": {
            "login": {
              "type": "string",
              "example": "user123"
            },
            "password": {
              "type": "string",
              "minLength": 6,
              "maxLength": 20,
              "example": "password123"
            },
            "email": {
              "type": "string",
              "example": "user@example.com"
            },
            "firstName": {
              "type": "string",
              "minLength": 1,
              "maxLength": 50,
              "example": "John"
            },
            "lastName": {
              "type": "string",
              "minLength": 1,
              "maxLength": 50,
              "example": "Doe"
            }
          },
          "required": [
            "login",
            "password",
            "email"
          ]
        },
        "UpdateUserInputDto": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "format": "email"
            }
          },
          "required": [
            "email"
          ]
        },
        "RegistrationConfirmationInputDto": {
          "type": "object",
          "properties": {
            "code": {
              "type": "string"
            }
          },
          "required": [
            "code"
          ]
        },
        "RegistrationEmailResendingInputDto": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string"
            }
          },
          "required": [
            "email"
          ]
        },
        "PasswordRecoveryInputDto": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "format": "email"
            }
          },
          "required": [
            "email"
          ]
        },
        "NewPasswordInputDto": {
          "type": "object",
          "properties": {
            "newPassword": {
              "type": "string",
              "minLength": 6,
              "maxLength": 20
            },
            "recoveryCode": {
              "type": "string"
            }
          },
          "required": [
            "newPassword",
            "recoveryCode"
          ]
        },
        "DeviceViewDto": {
          "type": "object",
          "properties": {
            "ip": {
              "type": "string",
              "description": "IP address of device during signing in",
              "example": "192.168.1.1"
            },
            "title": {
              "type": "string",
              "description": "Device name: for example Chrome 105 (received by parsing http header \"user-agent\")",
              "example": "Chrome 105"
            },
            "lastActiveDate": {
              "type": "string",
              "description": "Date of the last generating of refresh/access tokens",
              "example": "2024-01-15T10:30:00.000Z"
            },
            "deviceId": {
              "type": "string",
              "description": "Id of connected device session",
              "example": "550e8400-e29b-41d4-a716-446655440000"
            }
          },
          "required": [
            "ip",
            "title",
            "lastActiveDate",
            "deviceId"
          ]
        },
        "CreatePostByBlogIdInputDto": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string"
            },
            "shortDescription": {
              "type": "string"
            },
            "content": {
              "type": "string"
            }
          },
          "required": [
            "title",
            "shortDescription",
            "content"
          ]
        },
        "CreateBlogInputDto": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "websiteUrl": {
              "type": "string",
              "minLength": 1,
              "maxLength": 100
            }
          },
          "required": [
            "name",
            "description",
            "websiteUrl"
          ]
        },
        "UpdateBlogInputDto": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "websiteUrl": {
              "type": "string",
              "minLength": 1,
              "maxLength": 100
            }
          },
          "required": [
            "name",
            "description",
            "websiteUrl"
          ]
        },
        "CreateCommentInputDto": {
          "type": "object",
          "properties": {
            "content": {
              "type": "string"
            }
          },
          "required": [
            "content"
          ]
        },
        "LikeInputDto": {
          "type": "object",
          "properties": {
            "likeStatus": {
              "enum": [
                "None",
                "Like",
                "Dislike"
              ],
              "type": "string"
            }
          },
          "required": [
            "likeStatus"
          ]
        },
        "CreatePostInputDto": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string"
            },
            "shortDescription": {
              "type": "string"
            },
            "content": {
              "type": "string"
            },
            "blogId": {
              "type": "string"
            }
          },
          "required": [
            "title",
            "shortDescription",
            "content",
            "blogId"
          ]
        },
        "UpdatePostInputDto": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string"
            },
            "shortDescription": {
              "type": "string"
            },
            "content": {
              "type": "string"
            },
            "blogId": {
              "type": "string"
            }
          },
          "required": [
            "title",
            "shortDescription",
            "content",
            "blogId"
          ]
        },
        "UpdateCommentInputDto": {
          "type": "object",
          "properties": {
            "content": {
              "type": "string"
            }
          },
          "required": [
            "content"
          ]
        }
      }
    }
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  let urls = options.swaggerUrls
  let customOptions = options.customOptions
  let spec1 = options.swaggerDoc
  let swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (let attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  let ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.initOAuth) {
    ui.initOAuth(customOptions.initOAuth)
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }
  
  window.ui = ui
}
