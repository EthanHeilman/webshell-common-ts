import { TargetType } from '../../target/types/target.types';


export interface Target {
     /**
      * Unique ID for this target.
      */
     id: string;
     type: TargetType;
 }