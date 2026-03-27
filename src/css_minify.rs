use napi::bindgen_prelude::*;
use napi_derive::napi;

use lightningcss::printer::PrinterOptions;
use lightningcss::stylesheet::{ParserOptions, StyleSheet};
use lightningcss::targets::Targets;
use parcel_sourcemap::SourceMap;

#[napi(object)]
#[derive(Default)]
pub struct CssMinifyOptions {
    pub filename: Option<String>,
    pub source_map: Option<bool>,
}

#[napi(object)]
pub struct CssMinifyResult {
    pub code: String,
    pub map: Option<String>,
}

#[napi]
pub fn minify_css(code: String, options: Option<CssMinifyOptions>) -> Result<CssMinifyResult> {
    let opts = options.unwrap_or_default();

    let filename = opts.filename.as_deref().unwrap_or("input.css").to_string();
    let do_source_map = opts.source_map.unwrap_or(false);

    let parser_options = ParserOptions {
        filename: filename.clone(),
        ..ParserOptions::default()
    };

    let stylesheet = StyleSheet::parse(&code, parser_options).map_err(|e| {
        Error::new(
            Status::GenericFailure,
            format!("CSS parse error in {}: {}", filename, e),
        )
    })?;

    let mut source_map = if do_source_map {
        Some(SourceMap::new(""))
    } else {
        None
    };

    let printer_options = PrinterOptions {
        minify: true,
        source_map: source_map.as_mut(),
        targets: Targets::default(),
        ..PrinterOptions::default()
    };

    let result = stylesheet.to_css(printer_options).map_err(|e| {
        Error::new(
            Status::GenericFailure,
            format!("CSS minification error: {}", e),
        )
    })?;

    let map_json = if let Some(ref mut sm) = source_map {
        sm.to_json(None).ok()
    } else {
        None
    };

    Ok(CssMinifyResult {
        code: result.code,
        map: map_json,
    })
}
