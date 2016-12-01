export interface IError<A> {
  error: true,
  result: A
}

export interface ISuccess<A> {
  error: false,
  result: A
}