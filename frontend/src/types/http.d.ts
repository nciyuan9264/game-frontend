interface Page<T> {
    total: number;
    size: number;
    current: number;
    pages: number;
    records: T[];
}

export interface Result<T = any> {
    status_code: Status;
    message: string;
    data?: T;
}


export enum Status {
    Succeed = 200,
    Failed = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    InternalServerError = 500,
  }