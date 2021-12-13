import { TargetSummary } from '../../target/types/target-summary.types';

 export interface EnvironmentSummary { 
     id : string;
     organizationId : string;
     isDefault : boolean;
     name : string;
     description : string;
     timeCreated : Date;
     offlineCleanupTimeoutHours : number;
     targets : TargetSummary[];
 }