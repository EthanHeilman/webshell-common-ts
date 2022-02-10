import { TargetType } from '../../target/types/target.types';

export interface ProxyRequest {
    targetId: string;
    targetHost: string;
    targetPort: number;
    targetType: TargetType;
}
