import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import type { Env } from '../config/env.js';

@Injectable()
export class StorageService implements OnModuleInit {
  readonly client: S3Client;
  readonly bucket: string;
  constructor(config: ConfigService<Env, true>) {
    this.bucket = config.get('MINIO_BUCKET', { infer: true });
    this.client = new S3Client({
      endpoint: config.get('MINIO_ENDPOINT', { infer: true }),
      region: config.get('MINIO_REGION', { infer: true }),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.get('MINIO_ACCESS_KEY', { infer: true }),
        secretAccessKey: config.get('MINIO_SECRET_KEY', { infer: true }),
      },
    });
  }
  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch {
        /* readiness reports it */
      }
    }
  }
  put(key: string, body: Buffer, contentType: string) {
    return this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }
  get(key: string) {
    return this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key })) as Promise<{
      Body?: Readable;
      ContentType?: string;
      ContentLength?: number;
    }>;
  }
  delete(key: string) {
    return this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
  ready() {
    return this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }
}
