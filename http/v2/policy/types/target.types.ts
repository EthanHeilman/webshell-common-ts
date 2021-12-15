import { TargetType } from 'http/v2/target/types/target.types';

export interface Target {
     /**
      * Unique ID for this target.
      */
     id: string;
     type: TargetType;
 }