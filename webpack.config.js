// --------------------------------------------------
// 参考：https://yumegori.com/webpack5-setting-method
// --------------------------------------------------

// path モジュールの読み込み
const path = require("path");
// cssファイルの出力用
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// JS用：パッケージのライセンス情報をjsファイルに含める
const TerserPlugin = require("terser-webpack-plugin");
// EJS用
const { htmlWebpackPluginTemplateCustomizer } = require("template-ejs-loader");
// HTMLの読み込み用
const HtmlWebpackPlugin = require("html-webpack-plugin");
// IMG用
const CopyPlugin = require("copy-webpack-plugin");
const ImageminPlugin = require("imagemin-webpack-plugin").default;
const ImageminMozjpeg = require("imagemin-mozjpeg");
// 読み込むファイルを複数指定する用
const WebpackWatchedGlobEntries = require("webpack-watched-glob-entries-plugin");

// "production" か "development" を指定
const MODE = "development";
const enabledSourceMap = MODE === "development";

const filePath = {
  ejs: "./src/ejs/",
};

/* EJS読み込みの定義 */
const entries = WebpackWatchedGlobEntries.getEntries(
  [path.resolve(__dirname, `${filePath.ejs}**/*.ejs`)],
  {
    ignore: path.resolve(__dirname, `${filePath.ejs}**/_*.ejs`),
  }
)();
const htmlGlobPlugins = (entries) => {
  return Object.keys(entries).map(
    (key) =>
      new HtmlWebpackPlugin({
        //出力ファイル名
        filename: `${key}.html`,
        //ejsファイルの読み込み
        template: htmlWebpackPluginTemplateCustomizer({
          htmlLoaderOption: {
            //ファイル自動読み込みと圧縮を無効化
            sources: false,
            minimize: false,
          },
          templatePath: `${filePath.ejs}${key}.ejs`,
        }),

        //JS・CSS自動出力と圧縮を無効化
        inject: false,
        minify: false,
      })
  );
};

const app = {
  mode: MODE,
  entry: ["./src/assets/js/main.js", "./src/assets/scss/style.scss"],

  //出力先
  output: {
    filename: "./assets/js/[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },

  //仮想サーバーの設定
  devServer: {
    static: "dist",
    hot: true,
    open: true,
  },

  //パッケージのライセンス情報をjsファイルの中に含める
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },

  module: {
    rules: [
      // EJS
      {
        test: /\.ejs$/i,
        use: ["html-loader", "template-ejs-loader"],
      },
      // JS
      {
        test: /\.js$/,
        use: [
          {
            // Babel を利用する
            loader: "babel-loader",
            // Babel のオプションを指定する
            options: {
              presets: [
                // プリセットを指定することで、ES2020 を ES5 に変換
                "@babel/preset-env",
              ],
            },
          },
        ],
      },
      // SCSS
      {
        test: /\.s[ac]ss$/i,
        // Sassファイルの読み込みとコンパイル
        use: [
          // CSSファイルを抽出するように MiniCssExtractPlugin のローダーを指定
          {
            loader: MiniCssExtractPlugin.loader,
          },
          // CSSをバンドルするためのローダー
          {
            loader: "css-loader",
            options: {
              //URL の解決を無効に
              url: false,
              // production モードでなければソースマップを有効に
              sourceMap: enabledSourceMap,
              // postcss-loader と sass-loader の場合は2を指定
              importLoaders: 2,
              // 0 => no loaders (default);
              // 1 => postcss-loader;
              // 2 => postcss-loader, sass-loader
            },
          },
          // PostCSS（autoprefixer）の設定
          {
            loader: "postcss-loader",
            options: {
              // PostCSS でもソースマップを有効に
              sourceMap: enabledSourceMap,
              postcssOptions: {
                // ベンダープレフィックスを自動付与
                plugins: [require("autoprefixer")({ grid: true })],
              },
            },
          },
          // Sass を CSS へ変換するローダー
          {
            loader: "sass-loader",
            options: {
              //  production モードでなければソースマップを有効に
              sourceMap: enabledSourceMap,
            },
          },
        ],
      },
    ],
  },

  // ES5(IE11等)向けの指定
  target: ["web", "es5"],

  //プラグインの設定
  plugins: [
    // EJS→HTML
    ...htmlGlobPlugins(entries),
    // SCSS→CSS
    new MiniCssExtractPlugin({
      // 出力先
      filename: "./assets/css/[name].css",
    }),
    // IMG
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/assets/img/"),
          to: path.resolve(__dirname, "dist/assets/img"),
        },
      ],
    }),
    new ImageminPlugin({
      test: /\.(jpe?g|png|gif|svg)$/i,
      pngquant: {
        quality: "65-80",
      },
      gifsicle: {
        interlaced: false,
        optimizationLevel: 1,
        colors: 256,
      },
      svgo: {},
      plugins: [
        ImageminMozjpeg({
          quality: 85,
          progressive: true,
        }),
      ],
    }),
  ],

  //source-map タイプのソースマップを出力
  devtool: "source-map",

  // node_modules を監視（watch）対象から除外
  watchOptions: {
    ignored: /node_modules/, //正規表現で指定
  },
};

module.exports = app;
