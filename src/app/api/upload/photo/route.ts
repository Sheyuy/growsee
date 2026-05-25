import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/upload/photo
 * 获取上传所需的 presigned URL（由前端直接上传到 S3）
 * 返回 presignedUrl 和 cdnUrl，前端拿到后直接 PUT 文件到 presignedUrl
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id: userId } = auth.user;

  const ext = request.nextUrl.searchParams.get("ext") ?? "jpg";
  const contentType = request.nextUrl.searchParams.get("contentType") ?? "image/jpeg";
  const key = `timeline-photos/${userId}/${Date.now()}.${ext}`;

  // 动态导入 @eazo/sdk/server 使用服务端 presign
  // 如果 SDK 没有服务端 presign，退回到直接返回 key 让前端走 SDK upload
  // 前端将直接用 @eazo/sdk storage.upload()

  return NextResponse.json({ key, contentType });
}
