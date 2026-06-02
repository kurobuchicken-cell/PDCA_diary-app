// Googleドライブの動画を埋め込み再生するプレイヤー。
// drive.file で作成し家族に共有済みのファイルを、プレビューURLで表示する。
// 視聴者は家族のGoogleアカウントでログインしていれば再生できる。

export default function VideoPlayer({ fileId }: { fileId: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        title="練習動画"
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        className="h-full w-full"
        allow="autoplay"
        // ドライブのプレビューを別オリジンで埋め込むため許可
        allowFullScreen
      />
    </div>
  );
}
