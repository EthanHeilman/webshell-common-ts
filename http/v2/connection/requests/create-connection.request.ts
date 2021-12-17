import { TargetType } from "http/v2/target/types/target.types";

export interface CreateConnectionRequest {
     spaceId: string;
     targetId: string;
     targetType: TargetType;
     /**
      * The operating system user that will be used to connect as
      */
     targetUser: string;
 }