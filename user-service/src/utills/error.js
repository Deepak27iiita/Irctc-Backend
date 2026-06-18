 // utils/error.js

class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);

        this.statusCode = statusCode;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}

/*
|--------------------------------------------------------------------------
| 400 Errors
|--------------------------------------------------------------------------
*/

class BadRequestError extends AppError {
    constructor(message = "Bad Request", code = "BAD_REQUEST") {
        super(message, 400, code);
    }
}

class ValidationError extends AppError {
    constructor(message = "Validation Failed", code = "VALIDATION_ERROR") {
        super(message, 400, code);
    }
}

/*
|--------------------------------------------------------------------------
| 401 Errors
|--------------------------------------------------------------------------
*/

class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
        super(message, 401, code);
    }
}

/*
|--------------------------------------------------------------------------
| 403 Errors
|--------------------------------------------------------------------------
*/

class ForbiddenError extends AppError {
    constructor(message = "Forbidden", code = "FORBIDDEN") {
        super(message, 403, code);
    }
}

/*
|--------------------------------------------------------------------------
| 404 Errors
|--------------------------------------------------------------------------
*/

class NotFoundError extends AppError {
    constructor(message = "Resource Not Found", code = "NOT_FOUND") {
        super(message, 404, code);
    }
}

/*
|--------------------------------------------------------------------------
| 405 Errors
|--------------------------------------------------------------------------
*/

class MethodNotAllowedError extends AppError {
    constructor(
        message = "Method Not Allowed",
        code = "METHOD_NOT_ALLOWED"
    ) {
        super(message, 405, code);
    }
}

/*
|--------------------------------------------------------------------------
| 409 Errors
|--------------------------------------------------------------------------
*/

class ConflictError extends AppError {
    constructor(message = "Conflict", code = "CONFLICT") {
        super(message, 409, code);
    }
}

/*
|--------------------------------------------------------------------------
| 422 Errors
|--------------------------------------------------------------------------
*/

class UnprocessableEntityError extends AppError {
    constructor(
        message = "Unprocessable Entity",
        code = "UNPROCESSABLE_ENTITY"
    ) {
        super(message, 422, code);
    }
}

/*
|--------------------------------------------------------------------------
| 429 Errors
|--------------------------------------------------------------------------
*/

class TooManyRequestsError extends AppError {
    constructor(
        message = "Too Many Requests",
        code = "TOO_MANY_REQUESTS"
    ) {
        super(message, 429, code);
    }
}

/*
|--------------------------------------------------------------------------
| 500 Errors
|--------------------------------------------------------------------------
*/

class InternalServerError extends AppError {
    constructor(
        message = "Internal Server Error",
        code = "INTERNAL_SERVER_ERROR"
    ) {
        super(message, 500, code);
    }
}

class DatabaseError extends AppError {
    constructor(message = "Database Error", code = "DATABASE_ERROR") {
        super(message, 500, code);
    }
}

class ServiceUnavailableError extends AppError {
    constructor(
        message = "Service Unavailable",
        code = "SERVICE_UNAVAILABLE"
    ) {
        super(message, 503, code);
    }
}

module.exports = {
    AppError,

    BadRequestError,
    ValidationError,

    UnauthorizedError,
    ForbiddenError,

    NotFoundError,
    MethodNotAllowedError,

    ConflictError,
    UnprocessableEntityError,

    TooManyRequestsError,

    InternalServerError,
    DatabaseError,
    ServiceUnavailableError
};