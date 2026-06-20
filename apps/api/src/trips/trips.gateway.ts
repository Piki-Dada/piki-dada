import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from './socket-events';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class TripsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string);
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('trip:join')
  joinTripRoom(@ConnectedSocket() client: Socket, @MessageBody() tripId: string) {
    client.join(`trip:${tripId}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE)
  relayDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; location: { lat: number; lng: number }; heading?: number },
  ) {
    this.server.to(`trip:${data.tripId}`).emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
      tripId: data.tripId,
      driverId: client.data.userId,
      location: data.location,
      heading: data.heading,
    });
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToTrip(tripId: string, event: string, payload: unknown) {
    this.server.to(`trip:${tripId}`).emit(event, payload);
  }
}
