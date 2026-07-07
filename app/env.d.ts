// Viteの ?url インポート用の型宣言（グローバルスコープに置くためimport文を含めない）
declare module '*.css?url' {
  const url: string;
  export default url;
}
