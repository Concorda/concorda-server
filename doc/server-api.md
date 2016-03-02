Back to [TOC](./Readme.md)

# Server API

Concorda will expose the following HTTP API:

## Authorization

 Method   | URL                                  | Description                           | Documentation
 ---------|--------------------------------------|---------------------------------------|------------------------------------------
 POST     | /auth/change_password                | Change password                       | https://github.com/senecajs/seneca-auth
 POST     | /auth/register                       | Register user and login automatically | https://github.com/senecajs/seneca-auth
 POST     | /auth/confirm                        | Confirm login                         | https://github.com/senecajs/seneca-auth
 GET/POST | /auth/logout                         | Logout current user                   | https://github.com/senecajs/seneca-auth
 POST     | /auth/create_reset                   | Create reset password token           | https://github.com/senecajs/seneca-auth
 POST     | /auth/load_reset                     | Load reset token                      | https://github.com/senecajs/seneca-auth
 POST     | /auth/execute_reset                  | Execute reset password                | https://github.com/senecajs/seneca-auth
 GET/POST | /auth/user                           | Get current user data                 | https://github.com/senecajs/seneca-auth
 POST     | /auth/update_user                    | Update current logged in user         | https://github.com/senecajs/seneca-auth
 GET/POST | /auth/login                          | Login                                 | https://github.com/senecajs/seneca-auth


## User management

 Method   | URL                                | Description                          
 ---------|------------------------------------|--------------------------------------
 POST     | /api/user/{user_id}/session/close  | Close sessions for selected user
 GET      | /api/user                          | Get list of users
 GET      | /api/user/user_id                  | Load user by id
 POST     | /api/user                          | Create an user, different from the one logged in
 PUT      | /api/user                          | Update an user, different from the one logged in
 DELETE   | /api/user/{user_id}                | Delete an user

## Client management

 Method   | URL                                | Description                          
 ---------|------------------------------------|--------------------------------------
 GET      | /api/client                        | Get list of clients
 GET      | /api/client/:clientId              | Get client
 GET      | /client/:client_name               | Public service for getting client & its settings
 GET      | /api/clients                       | Get list of clients
 POST     | /api/client                        | Create a client
 PUT      | /api/client                        | Update a client
 PUT      | /client                            | Public service for updating a client. Can be used just when client.configured=false
 DELETE   | /api/client/{client_id}            | Delete a client


## Tag management

 Method   | URL                                | Description                          
 ---------|------------------------------------|--------------------------------------
 GET      | /api/tag                           | Get list of tags
 GET      | /api/tags                          | Get list of tags. An alias for /api/tag

## User-Tag management

 Method   | URL                                | Description                          
 ---------|------------------------------------|--------------------------------------
 POST     | /api/user/:userId/tag/:tagId/add   | Add a tag to a specified user
 POST     | /api/user/:userId/tag/:tagId/remove| Remove a tag from a specified user

