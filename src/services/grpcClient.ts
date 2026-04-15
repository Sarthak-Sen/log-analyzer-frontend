import * as grpcWeb from 'grpc-web'
import protobuf from 'protobufjs'

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? ''

let protoRoot: protobuf.Root | null = null

async function getProtoRoot(): Promise<protobuf.Root> {
  if (protoRoot) return protoRoot
  protoRoot = await protobuf.load('/log_analyzer.proto')
  return protoRoot
}

export async function analyzeLogs(
  jobId: string,
  totalChunks: number,
  metadata: Record<string, string>
): Promise<grpcWeb.ClientReadableStream<any>> {
  const root = await getProtoRoot()

  const JobRequest = root.lookupType('loganalyzer.JobRequest')
  const AnalysisUpdate = root.lookupType('loganalyzer.AnalysisUpdate')

  const requestPayload = JobRequest.create({ jobId, totalChunks })
  const requestBytes = JobRequest.encode(requestPayload).finish()

  const methodDescriptor = new grpcWeb.MethodDescriptor(
    '/loganalyzer.LogAnalyzer/AnalyzeLogs',
    grpcWeb.MethodType.SERVER_STREAMING,
    Object as any,
    Object as any,
    () => requestBytes,
    (bytes: Uint8Array) => AnalysisUpdate.decode(bytes)
  )

  const client = new grpcWeb.GrpcWebClientBase({ format: 'binary' })

  return client.serverStreaming(
    `${backendUrl}/loganalyzer.LogAnalyzer/AnalyzeLogs`,
    {},
    metadata,
    methodDescriptor
  )
}