import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Fabric {
    id: bigint;
    gsm: number;
    fabricCode: string;
    fabricName: string;
    fabricType: string;
    imageUrl?: string;
    width: number;
    composition: string;
}
export interface ColourVariant {
    id: bigint;
    pantoneCode: string;
    hexValue: string;
    colourName: string;
    fabricId: bigint;
}
export interface UserRecord {
    principal: Principal;
    firstLoginTime: bigint;
    lastLoginTime: bigint;
    loginCount: bigint;
    isBlocked: boolean;
}
export type RecordLoginResult = { __kind__: "ok" } | { __kind__: "blocked" };
export interface backendInterface {
    recordLogin(): Promise<RecordLoginResult>;
    isAdmin(): Promise<boolean>;
    isBlocked(): Promise<boolean>;
    getLoginHistory(): Promise<Array<UserRecord>>;
    blockUser(target: Principal): Promise<void>;
    unblockUser(target: Principal): Promise<void>;
    createColourVariant(fabricId: bigint, colourName: string, pantoneCode: string, hexValue: string): Promise<bigint>;
    createFabric(fabricCode: string, fabricName: string, fabricType: string, composition: string, gsm: number, width: number, imageUrl: string | null): Promise<bigint>;
    deleteFabric(id: bigint): Promise<void>;
    getAllFabrics(): Promise<Array<Fabric>>;
    getColourVariantsByFabric(fabricId: bigint): Promise<Array<ColourVariant>>;
    getFabricById(id: bigint): Promise<Fabric>;
    updateFabric(id: bigint, fabricCode: string, fabricName: string, fabricType: string, composition: string, gsm: number, width: number, imageUrl: string | null): Promise<void>;
}
