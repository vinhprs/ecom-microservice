import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import {
  GRPC_SERVICES,
  GRPC_PACKAGES,
  GRPC_URLS,
  getProtoPath,
  PROTO_FILES,
} from '../constants/grpc.constant';

export const CategoryGrpcClientOptions: ClientsModuleOptions = [
  {
    name: GRPC_SERVICES.CATEGORY,
    transport: Transport.GRPC,
    options: {
      package: GRPC_PACKAGES.CATEGORY,
      protoPath: getProtoPath(PROTO_FILES.CATEGORY),
      url: GRPC_URLS.CATEGORY,
      maxReceiveMessageLength: 1024 * 1024 * 10,
      maxSendMessageLength: 1024 * 1024 * 10,
      channelOptions: {
        'grpc.keepalive_time_ms': 30000,
        'grpc.keepalive_timeout_ms': 10000,
        'grpc.keepalive_permit_without_calls': 1,
        'grpc.http2.max_pings_without_data': 0,
        'grpc.http2.min_time_between_pings_ms': 10000,
      },
      gracefulShutdown: true,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  },
];
