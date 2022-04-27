export interface OptionalPort {
  /**
   * Port value. Setting to null will clear current value.
   */
  value?: number;
}

export interface RequiredPort {
  /**
   * Port value. Setting to null will result in no change on the back end.
   */
   value: number;
}
