use std::path::PathBuf;

use napi::bindgen_prelude::*;
use napi_derive::napi;
use oxc_allocator::Allocator;
use oxc_codegen::{Codegen, CodegenOptions};
use oxc_minifier::{CompressOptions, MangleOptions, Minifier, MinifierOptions};
use oxc_parser::Parser;
use oxc_span::SourceType;

#[napi(object)]
#[derive(Default)]
pub struct JsMinifyOptions {
    pub mangle: Option<bool>,
    pub compress: Option<bool>,
    pub source_map: Option<bool>,
    pub filename: Option<String>,
    pub module: Option<bool>,
}

#[napi(object)]
pub struct JsMinifyResult {
    pub code: String,
    pub map: Option<String>,
}

#[napi]
pub fn minify_js(code: String, options: Option<JsMinifyOptions>) -> Result<JsMinifyResult> {
    let opts = options.unwrap_or_default();

    let filename = opts.filename.as_deref().unwrap_or("input.js");
    let is_module = opts.module.unwrap_or(false);
    let do_mangle = opts.mangle.unwrap_or(true);
    let do_compress = opts.compress.unwrap_or(true);
    let do_source_map = opts.source_map.unwrap_or(false);

    let source_type = if is_module {
        SourceType::mjs()
    } else {
        SourceType::unambiguous()
    };

    let allocator = Allocator::default();
    let parse_result = Parser::new(&allocator, &code, source_type).parse();

    if parse_result.panicked || !parse_result.errors.is_empty() {
        let error_msgs: Vec<String> = parse_result.errors.iter().map(|e| e.to_string()).collect();
        return Err(Error::new(
            Status::GenericFailure,
            format!("Parse error in {}: {}", filename, error_msgs.join(", ")),
        ));
    }

    let mut program = parse_result.program;

    let minifier_options = MinifierOptions {
        mangle: if do_mangle {
            Some(MangleOptions::default())
        } else {
            None
        },
        compress: if do_compress {
            Some(CompressOptions::default())
        } else {
            None
        },
    };

    let minifier_return = Minifier::new(minifier_options).minify(&allocator, &mut program);

    let codegen_options = CodegenOptions {
        minify: true,
        source_map_path: if do_source_map {
            Some(PathBuf::from(filename))
        } else {
            None
        },
        ..CodegenOptions::default()
    };

    let mut codegen = Codegen::new()
        .with_options(codegen_options)
        .with_source_text(&code);

    if let Some(scoping) = minifier_return.scoping {
        codegen = codegen.with_scoping(Some(scoping));
    }

    if let Some(mappings) = minifier_return.class_private_mappings {
        codegen = codegen.with_private_member_mappings(Some(mappings));
    }

    let codegen_result = codegen.build(&program);

    let map = if do_source_map {
        codegen_result.map.map(|sm| sm.to_json_string())
    } else {
        None
    };

    Ok(JsMinifyResult {
        code: codegen_result.code,
        map,
    })
}
