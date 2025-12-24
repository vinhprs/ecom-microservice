// libs/common/src/grpc/constants/grpc.constant.ts
import { join } from 'path';

export const GRPC_PACKAGES = {
  CATEGORY: 'category',
  PRODUCT: 'product',
  ORDER: 'order',
  USER: 'user',
};

export const GRPC_SERVICES = {
  CATEGORY: 'CATEGORY_GRPC_SERVICE',
  PRODUCT: 'PRODUCT_GRPC_SERVICE',
  ORDER: 'ORDER_GRPC_SERVICE',
  USER: 'USER_GRPC_SERVICE',
};

export const GRPC_PORTS = {
  CATEGORY: 5001,
  PRODUCT: 5002,
  ORDER: 5003,
  USER: 5004,
};

export const GRPC_URLS = {
  CATEGORY: 'categories-service:5001',
  PRODUCT: 'products-service:5002',
  ORDER: 'orders-service:5003',
  USER: 'users-service:5004',
};

// Helper to get proto path
// Uses process.cwd() to reference source proto files (not dist)
// Works in both dev and Docker where source files are mounted
export const getProtoPath = (protoFileName: string): string => {
  return join(process.cwd(), 'libs/common/src/grpc/proto', protoFileName);
};

// Proto file names
export const PROTO_FILES = {
  CATEGORY: 'category.proto',
  PRODUCT: 'product.proto',
  ORDER: 'order.proto',
  USER: 'user.proto',
};
